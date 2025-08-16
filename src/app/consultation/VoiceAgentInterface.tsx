'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Room, RoomEvent, RemoteParticipant, LocalParticipant, DataPacket_Kind, Track } from 'livekit-client';
import { Mic, MicOff, Phone, PhoneOff, MessageSquare, Volume2, VolumeX, Play, Pause, CheckCircle } from 'lucide-react';
import { ConversationMessage } from '@/types';

interface VoiceAgentInterfaceProps {
  onBack?: () => void;
}

export const VoiceAgentInterface: React.FC<VoiceAgentInterfaceProps> = ({ onBack }) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [agentResponse, setAgentResponse] = useState<string>('');
  const [consultationStep, setConsultationStep] = useState<'patient-input' | 'doctor-review' | 'prescription'>('patient-input');
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [showStepComplete, setShowStepComplete] = useState(false);
  const [stepHistories, setStepHistories] = useState<{
    'patient-input': ConversationMessage[];
    'doctor-review': ConversationMessage[];
    'prescription': ConversationMessage[];
  }>({
    'patient-input': [],
    'doctor-review': [],
    'prescription': []
  });
  
  const [consultationData, setConsultationData] = useState<{
    patientAnalysis?: any;
    doctorRecommendations?: any;
    prescription?: any;
  }>({});
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  // LiveKit configuration from environment variables
  const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://your-livekit-server.com';

  useEffect(() => {
    // Initialize LiveKit room
    const initializeRoom = async () => {
      try {
        const newRoom = new Room({
          adaptiveStream: true,
          dynacast: true,
        });

        // Set up room event listeners
        newRoom.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
          console.log('Agent connected:', participant.identity);
          setIsAgentSpeaking(true);
        });

        newRoom.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
          console.log('Agent disconnected:', participant.identity);
          setIsAgentSpeaking(false);
        });

        newRoom.on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: RemoteParticipant) => {
          try {
            const data = new TextDecoder().decode(payload);
            const parsedData = JSON.parse(data);
            
            if (parsedData.type === 'agent_response') {
              setAgentResponse(parsedData.text);
              setIsAgentSpeaking(true);
              setConversationHistory(prev => [...prev, { role: 'assistant', text: parsedData.text }]);
              
              setTimeout(() => {
                setIsAgentSpeaking(false);
              }, 3000);
            }
          } catch (error) {
            console.error('Error parsing data:', error);
          }
        });

        setRoom(newRoom);
      } catch (error) {
        console.error('Error initializing room:', error);
      }
    };

    initializeRoom();
  }, []);

  const connectToAgent = async () => {
    if (!room) return;
    
    try {
      setLoading(true);
      console.log('🔗 Attempting to connect to agent...');
      
      // Generate room token
      const token = await generateRoomToken();
      console.log('🎫 Room token generated successfully');
      
      // Connect to the room (agent will automatically join as it's already running)
      await room.connect(LIVEKIT_URL, token);
      console.log('✅ Connected to LiveKit room');
      
      setIsConnected(true);
      setLoading(false);
      
      // Initial greeting from agent with real voice synthesis
      setTimeout(async () => {
        const greeting = "Hola, soy su asistente médico virtual. Vamos a recopilar su información médica. ¿Cuáles son sus síntomas principales?";
        setAgentResponse(greeting);
        setConversationHistory(prev => [...prev, { role: 'assistant', text: greeting }]);
        
        try {
          // Generate voice for greeting
          const response = await fetch('/api/voice/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: greeting })
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.audioBase64) {
              const audioBlob = new Blob([Uint8Array.from(atob(result.audioBase64), c => c.charCodeAt(0))], 
                { type: 'audio/mpeg' });
              const audioUrl = URL.createObjectURL(audioBlob);
              const audio = new Audio(audioUrl);
              
              setIsAgentSpeaking(true);
              audio.onended = () => {
                setIsAgentSpeaking(false);
                URL.revokeObjectURL(audioUrl);
              };
              
              await audio.play();
            }
          } else {
            // Fallback: just show speaking animation
            setIsAgentSpeaking(true);
            setTimeout(() => setIsAgentSpeaking(false), 1500);
          }
        } catch (error) {
          console.error('Error generating greeting audio:', error);
          // Fallback: just show speaking animation
          setIsAgentSpeaking(true);
          setTimeout(() => setIsAgentSpeaking(false), 1500);
        }
      }, 1000);
    } catch (error) {
      console.error('Failed to connect to room:', error);
      setLoading(false);
    }
  };

  const disconnectFromAgent = async () => {
    if (room) {
      await room.disconnect();
      setIsConnected(false);
      setTranscript('');
      setAgentResponse('');
      setConsultationStep('patient-input');
      setConversationHistory([]);
      setIsRecording(false);
    }
  };

  const toggleMute = async () => {
    // For now, we'll just toggle the mute state visually
    // In a real implementation, this would control the actual audio track
    setIsMuted(!isMuted);
  };

  const generateRoomToken = async (): Promise<string> => {
    try {
      const roomName = 'medical-consultation-' + Date.now();
      const participantName = 'patient-' + Math.random().toString(36).substr(2, 9);
      
      const response = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName,
          participantName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate token');
      }

      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('Error generating token:', error);
      throw error;
    }
  };

  const startRecording = async () => {
    if (!isConnected || !room) return;
    
    try {
      setIsRecording(true);
      setTranscript(prev => prev + '\n[Grabando...]');
      setLoading(true);

      // Get user media (microphone access)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Enable microphone for LiveKit room
      await room.localParticipant.setMicrophoneEnabled(true);
      
      console.log('🎤 Audio track published to LiveKit room');
      
      // Set up audio track event listeners for agent responses
      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Audio && participant.identity !== room.localParticipant.identity) {
          console.log('🎧 Received audio from agent:', participant.identity);
          setIsAgentSpeaking(true);
          
          // Play the audio track
          const audioElement = track.attach();
          audioElement.onended = () => {
            setIsAgentSpeaking(false);
          };
          document.body.appendChild(audioElement);
        }
      });

      // Set up data channel for text messages
      room.on(RoomEvent.DataReceived, (payload, participant) => {
        if (participant && participant.identity !== room.localParticipant.identity) {
          const data = JSON.parse(new TextDecoder().decode(payload));
          console.log('📨 Received message from agent:', data);
          
          if (data.type === 'text') {
            setAgentResponse(data.text);
            setConversationHistory(prev => [...prev, { role: 'assistant', text: data.text }]);
            setTranscript(prev => prev.replace('[Grabando...]', ''));
          }
        }
      });

      // Stop recording after 5 seconds (or implement voice activity detection)
      setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, 5000);

    } catch (error) {
      console.error('Error starting LiveKit recording:', error);
      setTranscript(prev => prev.replace('[Grabando...]', 'Error iniciando grabación'));
      setLoading(false);
    }
  };

  const stopRecording = async () => {
    if (!room) return;
    
    try {
      // Disable microphone
      await room.localParticipant.setMicrophoneEnabled(false);
      
      setIsRecording(false);
      setLoading(false);
      console.log('🛑 Recording stopped');
      
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const sendTextMessage = async (message: string) => {
    if (!isConnected || !message.trim()) return;
    
    setLoading(true);
    setConversationHistory(prev => [...prev, { role: 'user', text: message }]);
    
    try {
      // Create a fake audio blob for text input (we'll process it as text anyway)
      const formData = new FormData();
      const textBlob = new Blob([message], { type: 'text/plain' });
      formData.append('audio', textBlob, 'text-input.txt');
      formData.append('history', JSON.stringify(conversationHistory));
      formData.append('step', consultationStep);
      formData.append('isText', 'true'); // Flag to indicate this is text input

      const response = await fetch('/api/voice/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process text message');
      }

      const result = await response.json();
      
      // Update UI with results
      setConversationHistory(prev => [...prev, { role: 'assistant', text: result.response }]);
      setAgentResponse(result.response);
      
      // Check if step is complete
      if (result.stepComplete) {
        setShowStepComplete(true);
        // Store analysis data if available
        if (result.analysisData) {
          if (consultationStep === 'patient-input') {
            setConsultationData(prev => ({ ...prev, patientAnalysis: result.analysisData }));
          } else if (consultationStep === 'doctor-review') {
            setConsultationData(prev => ({ ...prev, doctorRecommendations: result.analysisData }));
          }
        }
      } else {
        setConsultationStep(result.nextStep);
      }
      
      // Play agent response audio
      if (result.audioBase64) {
        const audioBlob = new Blob([Uint8Array.from(atob(result.audioBase64), c => c.charCodeAt(0))], 
          { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        setIsAgentSpeaking(true);
        audio.onended = () => {
          setIsAgentSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        await audio.play();
      }

    } catch (error) {
      console.error('Error processing text message:', error);
      setAgentResponse('Error procesando mensaje. Inténtelo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const completeCurrentStep = async () => {
    const nextStep = getNextStep(consultationStep);
    
    // Save current conversation to step history
    setStepHistories(prev => ({
      ...prev,
      [consultationStep]: [...conversationHistory]
    }));
    
    setConsultationStep(nextStep);
    setShowStepComplete(false);
    
    // Clear conversation history for new step
    setConversationHistory([]);
    setTranscript('');
    
    // Generate dynamic summary and start new step
    await generateStepSummary(nextStep);
  };

  const generateStepSummary = async (step: string) => {
    if (step === 'doctor-review') {
      // Get patient input history for summary
      const patientHistory = stepHistories['patient-input'];
      
      try {
        const response = await fetch('/api/voice/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            step: step,
            conversationHistory: patientHistory
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setConversationHistory([{ role: 'assistant', text: result.summary }]);
            setAgentResponse(result.summary);
            
            // Play summary audio
            if (result.audioBase64) {
              const audioBlob = new Blob([Uint8Array.from(atob(result.audioBase64), c => c.charCodeAt(0))],
                { type: 'audio/mpeg' });
              const audioUrl = URL.createObjectURL(audioBlob);
              const audio = new Audio(audioUrl);

              setIsAgentSpeaking(true);
              audio.onended = () => {
                setIsAgentSpeaking(false);
                URL.revokeObjectURL(audioUrl);
              };

              await audio.play();
            }
          }
        }
      } catch (error) {
        console.error('Error generating summary:', error);
        // Fallback summary
        const fallbackSummary = "Basándome en la información recopilada, procedo a realizar la evaluación médica. ¿Desea que proceda con el análisis médico?";
        setConversationHistory([{ role: 'assistant', text: fallbackSummary }]);
        setAgentResponse(fallbackSummary);
      }
    } else if (step === 'prescription') {
      // Get doctor review history for summary
      const doctorHistory = stepHistories['doctor-review'];
      
      try {
        const response = await fetch('/api/voice/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            step: step,
            conversationHistory: doctorHistory
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setConversationHistory([{ role: 'assistant', text: result.summary }]);
            setAgentResponse(result.summary);
            
            // Play summary audio
            if (result.audioBase64) {
              const audioBlob = new Blob([Uint8Array.from(atob(result.audioBase64), c => c.charCodeAt(0))],
                { type: 'audio/mpeg' });
              const audioUrl = URL.createObjectURL(audioBlob);
              const audio = new Audio(audioUrl);

              setIsAgentSpeaking(true);
              audio.onended = () => {
                setIsAgentSpeaking(false);
                URL.revokeObjectURL(audioUrl);
              };

              await audio.play();
            }
          }
        }
      } catch (error) {
        console.error('Error generating summary:', error);
        // Fallback summary
        const fallbackSummary = "Basándome en la evaluación médica realizada, procedo a generar las recomendaciones y prescripción médica. ¿Desea que proceda con la prescripción?";
        setConversationHistory([{ role: 'assistant', text: fallbackSummary }]);
        setAgentResponse(fallbackSummary);
      }
    }
  };

  const getNextStep = (currentStep: string): 'patient-input' | 'doctor-review' | 'prescription' => {
    switch (currentStep) {
      case 'patient-input':
        return 'doctor-review';
      case 'doctor-review':
        return 'prescription';
      case 'prescription':
        return 'prescription'; // Stay in prescription
      default:
        return 'patient-input';
    }
  };

  const getStepCompletionMessage = (step: string): string => {
    switch (step) {
      case 'patient-input':
        return 'Perfecto, he recopilado toda la información necesaria. Ahora procederé a realizar la evaluación médica.';
      case 'doctor-review':
        return 'Excelente, he completado la evaluación médica. Ahora procederé a generar las recomendaciones y prescripción.';
      case 'prescription':
        return 'He completado la prescripción médica. Su consulta ha terminado.';
      default:
        return 'Paso completado.';
    }
  };

  const getStepDescription = () => {
    switch (consultationStep) {
      case 'patient-input':
        return 'Paso 1: Información del Paciente';
      case 'doctor-review':
        return 'Paso 2: Revisión del Médico';
      case 'prescription':
        return 'Paso 3: Prescripción';
      default:
        return 'Consulta en progreso';
    }
  };

  const PatientAnalysisDisplay = ({ analysis }: { analysis: any }) => {
    if (!analysis) return null;

    const getUrgencyColor = (level: string) => {
      switch (level) {
        case 'emergency': return 'bg-red-100 text-red-800';
        case 'high': return 'bg-orange-100 text-orange-800';
        case 'medium': return 'bg-yellow-100 text-yellow-800';
        case 'low': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Análisis del Paciente</h3>
        
        <div className="space-y-4">
          {/* Summary */}
          {analysis.summary && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Resumen</h4>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-md">
                {analysis.summary}
              </p>
            </div>
          )}

          {/* Key Symptoms */}
          {analysis.keySymptoms && analysis.keySymptoms.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Síntomas Principales</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.keySymptoms.map((symptom: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {symptom}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Potential Concerns */}
          {analysis.potentialConcerns && analysis.potentialConcerns.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Preocupaciones Potenciales</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.potentialConcerns.map((concern: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                  >
                    {concern}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Next Steps */}
          {analysis.recommendedNextSteps && analysis.recommendedNextSteps.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Próximos Pasos Recomendados</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                {analysis.recommendedNextSteps.map((step: string, index: number) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Urgency */}
          {analysis.urgency && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Nivel de Urgencia</h4>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(analysis.urgency)}`}>
                {analysis.urgency.toUpperCase()}
              </span>
            </div>
          )}

          {/* Additional Notes */}
          {analysis.notes && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Notas Adicionales</h4>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-md">
                {analysis.notes}
              </p>
            </div>
          )}

          {/* Disclaimer */}
          {analysis.disclaimer && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                {analysis.disclaimer}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const DoctorRecommendationsDisplay = ({ recommendations }: { recommendations: any }) => {
    if (!recommendations) return null;

    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recomendaciones de Tratamiento</h3>
        
        <div className="space-y-4">
          {/* Treatment Plan */}
          {recommendations.treatmentPlan && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Recomendaciones Principales</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                {recommendations.treatmentPlan.primaryRecommendations?.map((rec: string, index: number) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Medications */}
          {recommendations.medications && recommendations.medications.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Medicamentos Sugeridos</h4>
              <div className="space-y-2">
                {recommendations.medications.map((med: any, index: number) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-md">
                    <div className="font-medium text-gray-900">{med.name}</div>
                    <div className="text-sm text-gray-600">
                      Dosificación: {med.dosage} | Frecuencia: {med.frequency} | Duración: {med.duration}
                    </div>
                    {med.notes && (
                      <div className="text-sm text-gray-500 mt-1">{med.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lifestyle Recommendations */}
          {recommendations.lifestyleRecommendations && recommendations.lifestyleRecommendations.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Recomendaciones de Estilo de Vida</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                {recommendations.lifestyleRecommendations.map((rec: string, index: number) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Follow-up */}
          {recommendations.followUp && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Seguimiento</h4>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-md">
                {recommendations.followUp}
              </p>
            </div>
          )}

          {/* Warnings */}
          {recommendations.warnings && recommendations.warnings.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Advertencias</h4>
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <ul className="list-disc list-inside space-y-1 text-red-800">
                  {recommendations.warnings.map((warning: string, index: number) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Consulta Médica con Agente de Voz IA</h1>
              <span className="ml-4 px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
                {getStepDescription()}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ← Volver
                </button>
              )}
              {!isConnected ? (
                <button
                  onClick={connectToAgent}
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  {loading ? 'Conectando...' : 'Iniciar Consulta'}
                </button>
              ) : (
                <button
                  onClick={disconnectFromAgent}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <PhoneOff className="w-4 h-4 mr-2" />
                  Desconectar
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center">
              <div className={`flex-1 h-2 rounded-full ${consultationStep === 'patient-input' ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mx-2 ${
                consultationStep === 'patient-input' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <div className={`flex-1 h-2 rounded-full ${consultationStep === 'doctor-review' ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mx-2 ${
                consultationStep === 'doctor-review' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <div className={`flex-1 h-2 rounded-full ${consultationStep === 'prescription' ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mx-2 ${
                consultationStep === 'prescription' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Display Analysis Data for Steps 2 and 3 */}
        {consultationStep === 'doctor-review' && consultationData.patientAnalysis && (
          <PatientAnalysisDisplay analysis={consultationData.patientAnalysis} />
        )}
        
        {consultationStep === 'prescription' && consultationData.doctorRecommendations && (
          <DoctorRecommendationsDisplay recommendations={consultationData.doctorRecommendations} />
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Voice Controls */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Controles de Voz</h2>
              
              {/* Connection Status */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Estado de Conexión</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {isConnected ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
              </div>

              {/* Voice Recording Controls */}
              <div className="space-y-4">
                <button
                  onClick={startRecording}
                  disabled={!isConnected || isRecording || loading}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-5 h-5 mr-2 animate-pulse" />
                      Grabando...
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5 mr-2" />
                      Hablar
                    </>
                  )}
                </button>

                <button
                  onClick={toggleMute}
                  className="w-full flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  {isMuted ? (
                    <>
                      <VolumeX className="w-4 h-4 mr-2" />
                      Desactivar Silencio
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 mr-2" />
                      Silenciar
                    </>
                  )}
                </button>
              </div>

              {/* Agent Status */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Estado del Agente</h3>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isAgentSpeaking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                  }`}></div>
                  <span className="text-sm text-gray-600">
                    {isAgentSpeaking ? 'Hablando...' : 'Esperando'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            {/* Analysis Display for Steps 2 and 3 */}
            {consultationStep === 'doctor-review' && consultationData.patientAnalysis && (
              <PatientAnalysisDisplay analysis={consultationData.patientAnalysis} />
            )}
            
            {consultationStep === 'prescription' && consultationData.doctorRecommendations && (
              <DoctorRecommendationsDisplay recommendations={consultationData.doctorRecommendations} />
            )}
            
            <div className="bg-white rounded-lg shadow-lg h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Conversación Médica</h2>
                <p className="text-sm text-gray-600">Agente de IA en español</p>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={transcriptRef}>
                {conversationHistory.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Haz clic en &quot;Iniciar Consulta&quot; para comenzar</p>
                  </div>
                ) : (
                  conversationHistory.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                      </div>
                    </div>
                  ))
                )}
                
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm">Procesando...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Step Completion Notification */}
              {showStepComplete && (
                <div className="p-4 border-t bg-blue-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          Paso completado
                        </p>
                        <p className="text-xs text-blue-700">
                          {getStepDescription()} - Listo para continuar
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={completeCurrentStep}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Continuar al Siguiente Paso
                    </button>
                  </div>
                </div>
              )}

              {/* Manual Step Completion Button */}
              {isConnected && !showStepComplete && consultationStep !== 'prescription' && (
                <div className="p-4 border-t bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        ¿Completaste este paso?
                      </p>
                      <p className="text-xs text-gray-600">
                        Puedes continuar manualmente al siguiente paso
                      </p>
                    </div>
                    <button
                      onClick={completeCurrentStep}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Completar Paso
                    </button>
                  </div>
                </div>
              )}

              {/* Text Input */}
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Escriba su mensaje aquí..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement;
                        if (target.value.trim()) {
                          sendTextMessage(target.value.trim());
                          target.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                      if (input && input.value.trim()) {
                        sendTextMessage(input.value.trim());
                        input.value = '';
                      }
                    }}
                    disabled={!isConnected || loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}; 