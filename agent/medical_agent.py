#!/usr/bin/env python3
"""
Medical Consultation Voice Agent for LiveKit
This agent provides medical consultation services through voice interaction in Spanish.
Uses STT-LLM-TTS pipeline: Deepgram (STT) + OpenAI (LLM) + Cartesia (TTS)
"""

import asyncio
import json
import logging
import os
from typing import Dict, Any
from dotenv import load_dotenv

from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions
from livekit.plugins import (
    openai,
    cartesia,
    deepgram,
    noise_cancellation,
    silero,
)
from livekit.plugins.turn_detector.multilingual import MultilingualModel

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Medical consultation system prompt in Spanish
MEDICAL_SYSTEM_PROMPT = """
Eres un asistente médico virtual profesional diseñado para ayudar a pacientes con consultas iniciales en español.
Tu rol es:

1. Saludar a los pacientes cálidamente y presentarte como asistente médico virtual
2. Recopilar síntomas del paciente y antecedentes médicos de manera estructurada
3. Analizar la información proporcionada usando conocimientos médicos
4. Proporcionar recomendaciones preliminares y próximos pasos
5. Siempre recordar a los pacientes que consulten con proveedores de atención médica calificados

Pautas importantes:
- Sé empático y profesional
- Haz preguntas aclaratorias cuando sea necesario
- Nunca proporciones diagnósticos definitivos
- Siempre recomienda consultar con un proveedor de atención médica para problemas serios
- Mantén la confidencialidad del paciente
- Habla únicamente en español

Paso actual de la consulta: {step}

Instrucciones específicas:
- Usa un tono cálido y profesional
- Pregunta sobre síntomas específicos
- Recopila información sobre duración de síntomas
- Pregunta sobre medicamentos actuales
- Inquiere sobre antecedentes médicos relevantes
- Siempre termina recomendando consultar con un médico
"""

class MedicalConsultationAgent(Agent):
    def __init__(self) -> None:
        super().__init__(instructions=MEDICAL_SYSTEM_PROMPT.format(step="saludo"))
        self.consultation_step = "saludo"
        self.patient_data = {}
        self.conversation_history = []
        
    def obtener_paso_consulta(self) -> str:
        """Obtener el paso actual de la consulta médica."""
        return self.consultation_step
    
    def actualizar_paso_consulta(self, paso: str) -> str:
        """Actualizar el paso actual de la consulta."""
        pasos_validos = ["saludo", "sintomas", "analisis", "recomendaciones"]
        if paso in pasos_validos:
            self.consultation_step = paso
            return f"Paso de consulta actualizado a: {paso}"
        return f"Paso inválido: {paso}. Pasos válidos son: {pasos_validos}"
    
    def almacenar_datos_paciente(self, clave: str, valor: str) -> str:
        """Almacenar información del paciente durante la consulta."""
        self.patient_data[clave] = valor
        return f"Almacenado {clave}: {valor}"
    
    def obtener_datos_paciente(self) -> Dict[str, Any]:
        """Obtener todos los datos almacenados del paciente."""
        return self.patient_data

async def entrypoint(ctx: agents.JobContext):
    """Punto de entrada principal para el agente de consulta médica."""
    
    # Inicializar el agente médico
    medical_agent = MedicalConsultationAgent()
    
    # Configurar la sesión con STT-LLM-TTS pipeline
    session = AgentSession(
        # Deepgram for Speech-to-Text (STT)
        stt=deepgram.STT(
            model="nova-3", 
            language="es"  # Spanish language
        ),
        
        # OpenAI for Large Language Model (LLM)
        llm=openai.LLM(
            model="gpt-4o-mini",
            system_prompt=MEDICAL_SYSTEM_PROMPT.format(step=medical_agent.consultation_step)
        ),
        
        # Cartesia for Text-to-Speech (TTS)
        tts=cartesia.TTS(
            model="sonic-2", 
            voice="f786b574-daa5-4673-aa0c-cbe3e8534c02"  # Spanish voice
        ),
        
        # Voice Activity Detection
        vad=silero.VAD.load(),
        
        # Turn detection for better conversation flow (optional)
        # turn_detection=MultilingualModel(),
    )

    # Iniciar la sesión
    await session.start(
        room=ctx.room,
        agent=medical_agent,
        room_input_options=RoomInputOptions(
            # LiveKit Cloud enhanced noise cancellation
            # - If self-hosting, omit this parameter
            # - For telephony applications, use `BVCTelephony` for best results
            noise_cancellation=noise_cancellation.BVC(), 
        ),
    )

    # Saludo inicial
    await session.generate_reply(
        instructions="Saluda al paciente cálidamente y presenta el servicio de consulta médica virtual en español."
    )

    # Bucle principal de conversación
    try:
        async for event in session:
            if event.type == "user_message":
                # Procesar entrada del usuario
                texto_usuario = event.text
                logger.info(f"Usuario dijo: {texto_usuario}")
                
                # Actualizar historial de conversación
                medical_agent.conversation_history.append({"role": "user", "content": texto_usuario})
                
                # Determinar siguiente paso basado en la conversación
                if medical_agent.consultation_step == "saludo":
                    if any(palabra in texto_usuario.lower() for palabra in ["síntoma", "dolor", "problema", "malestar", "enfermo", "fiebre"]):
                        medical_agent.consultation_step = "sintomas"
                        await session.generate_reply(
                            instructions="El paciente menciona síntomas. Comienza a recopilar información detallada sobre los síntomas, duración, intensidad y otros detalles relevantes."
                        )
                elif medical_agent.consultation_step == "sintomas":
                    if len(medical_agent.conversation_history) > 4:
                        medical_agent.consultation_step = "analisis"
                        await session.generate_reply(
                            instructions="Has recopilado suficiente información sobre síntomas. Comienza a analizar la situación y proporcionar recomendaciones preliminares."
                        )
                elif medical_agent.consultation_step == "analisis":
                    medical_agent.consultation_step = "recomendaciones"
                    await session.generate_reply(
                        instructions="Proporciona recomendaciones finales y recuerda al paciente consultar con un proveedor de atención médica calificado."
                    )
                else:
                    # Respuesta general
                    await session.generate_reply(
                        instructions="Continúa la conversación de manera profesional y empática."
                    )
                
    except Exception as e:
        logger.error(f"Error en la conversación: {e}")
        await session.generate_reply(
            instructions="Lo siento, ha ocurrido un error. Por favor, inténtelo de nuevo."
        )
    
    finally:
        await session.end()

if __name__ == "__main__":
    import sys
    
    # Check if this is a download-files command
    if len(sys.argv) > 1 and sys.argv[1] == "download-files":
        logger.info("Downloading model files...")
        # This would download any required model files
        # For now, just log that we're ready
        logger.info("Model files ready")
        sys.exit(0)
    
    # Check if this is a start command
    if len(sys.argv) > 1 and sys.argv[1] == "start":
        logger.info("Starting medical consultation agent...")
    else:
        logger.info("Starting medical consultation agent (default mode)...")
    
    # Verificar que las variables de entorno requeridas estén configuradas
    required_env_vars = [
        "LIVEKIT_URL", 
        "LIVEKIT_API_KEY", 
        "LIVEKIT_API_SECRET", 
        "OPENAI_API_KEY",
        "DEEPGRAM_API_KEY",
        "CARTESIA_API_KEY"
    ]
    missing_vars = [var for var in required_env_vars if not os.getenv(var)]
    
    if missing_vars:
        logger.error(f"Variables de entorno faltantes: {', '.join(missing_vars)}")
        logger.error("Por favor, configure estas variables en su archivo .env")
        sys.exit(1)
    
    # Log configuration
    logger.info("Medical consultation agent configuration:")
    logger.info(f"LiveKit URL: {os.getenv('LIVEKIT_URL')}")
    logger.info(f"Agent Name: medical-consultation-agent")
    logger.info(f"Language: Spanish")
    
    # Ejecutar el agente
    try:
        agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))
    except KeyboardInterrupt:
        logger.info("Agent stopped by user")
    except Exception as e:
        logger.error(f"Agent failed to start: {e}")
        sys.exit(1) 