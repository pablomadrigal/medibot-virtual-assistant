#!/usr/bin/env python3
"""
Medical Consultation Voice Agent for LiveKit
This agent provides medical consultation services through voice interaction in Spanish.
"""

import asyncio
import json
import logging
import os
from typing import Dict, Any
from livekit.agents import Worker, JobContext, WorkerOptions
from livekit.agents.llm import LLMStream
from livekit.agents.tts import TTSStream
from livekit.agents.stt import STTStream
from livekit.agents.tools import Tool, tool
import openai

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

class MedicalConsultationAgent:
    def __init__(self):
        self.consultation_step = "saludo"
        self.patient_data = {}
        self.conversation_history = []
        
    @tool("obtener_paso_consulta")
    def obtener_paso_consulta(self) -> str:
        """Obtener el paso actual de la consulta médica."""
        return self.consultation_step
    
    @tool("actualizar_paso_consulta")
    def actualizar_paso_consulta(self, paso: str) -> str:
        """Actualizar el paso actual de la consulta."""
        pasos_validos = ["saludo", "sintomas", "analisis", "recomendaciones"]
        if paso in pasos_validos:
            self.consultation_step = paso
            return f"Paso de consulta actualizado a: {paso}"
        return f"Paso inválido: {paso}. Pasos válidos son: {pasos_validos}"
    
    @tool("almacenar_datos_paciente")
    def almacenar_datos_paciente(self, clave: str, valor: str) -> str:
        """Almacenar información del paciente durante la consulta."""
        self.patient_data[clave] = valor
        return f"Almacenado {clave}: {valor}"
    
    @tool("obtener_datos_paciente")
    def obtener_datos_paciente(self) -> Dict[str, Any]:
        """Obtener todos los datos almacenados del paciente."""
        return self.patient_data

async def entrypoint(job: JobContext):
    """Punto de entrada principal para el agente de consulta médica."""
    
    # Inicializar el agente médico
    medical_agent = MedicalConsultationAgent()
    
    # Configurar la conversación
    conversation = job.create_conversation()
    
    # Inicializar flujos STT, LLM y TTS
    stt = STTStream.create(
        conversation,
        provider="openai",
        model="whisper-1",
        language="es"  # Configurar para español
    )
    
    llm = LLMStream.create(
        conversation,
        provider="openai",
        model="gpt-4",
        system_prompt=MEDICAL_SYSTEM_PROMPT.format(step=medical_agent.consultation_step),
        tools=[medical_agent.obtener_paso_consulta, medical_agent.actualizar_paso_consulta, 
               medical_agent.almacenar_datos_paciente, medical_agent.obtener_datos_paciente]
    )
    
    tts = TTSStream.create(
        conversation,
        provider="openai",
        model="tts-1",
        voice="alloy"  # Puedes cambiar a "echo", "fable", "onyx", "nova" según prefieras
    )
    
    # Iniciar la conversación
    await conversation.start()
    
    # Saludo inicial
    saludo_inicial = "Hola, soy su asistente médico virtual. ¿En qué puedo ayudarle hoy?"
    await conversation.say(saludo_inicial)
    
    # Bucle principal de conversación
    try:
        async for event in conversation:
            if event.type == "user_message":
                # Procesar entrada del usuario
                texto_usuario = event.text
                logger.info(f"Usuario dijo: {texto_usuario}")
                
                # Actualizar historial de conversación
                medical_agent.conversation_history.append({"role": "user", "content": texto_usuario})
                
                # Obtener respuesta de IA
                respuesta = await conversation.respond(texto_usuario)
                logger.info(f"IA respondió: {respuesta}")
                
                # Actualizar historial de conversación
                medical_agent.conversation_history.append({"role": "assistant", "content": respuesta})
                
                # Determinar siguiente paso basado en la conversación
                if medical_agent.consultation_step == "saludo":
                    if any(palabra in texto_usuario.lower() for palabra in ["síntoma", "dolor", "problema", "malestar", "enfermo", "fiebre"]):
                        medical_agent.consultation_step = "sintomas"
                elif medical_agent.consultation_step == "sintomas":
                    if len(medical_agent.conversation_history) > 4:
                        medical_agent.consultation_step = "analisis"
                elif medical_agent.consultation_step == "analisis":
                    medical_agent.consultation_step = "recomendaciones"
                
    except Exception as e:
        logger.error(f"Error en la conversación: {e}")
        await conversation.say("Lo siento, ha ocurrido un error. Por favor, inténtelo de nuevo.")
    
    finally:
        await conversation.end()

def main():
    """Función principal para ejecutar el agente."""
    # Verificar que las variables de entorno requeridas estén configuradas
    required_env_vars = ["LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET", "OPENAI_API_KEY"]
    missing_vars = [var for var in required_env_vars if not os.getenv(var)]
    
    if missing_vars:
        logger.error(f"Variables de entorno faltantes: {', '.join(missing_vars)}")
        logger.error("Por favor, configure estas variables en su archivo .env")
        return
    
    # Crear y ejecutar el worker
    worker = Worker(
        entrypoint=entrypoint,
        options=WorkerOptions(
            name="medical-consultation-agent",
            description="Agente de consulta médica en español"
        )
    )
    
    # Ejecutar el worker
    asyncio.run(worker.run())

if __name__ == "__main__":
    main() 