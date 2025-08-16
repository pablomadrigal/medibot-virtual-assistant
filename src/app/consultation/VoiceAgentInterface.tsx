'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Room, RoomEvent, RemoteParticipant, Track } from 'livekit-client';
import { Phone, PhoneOff, MessageSquare, Volume2, VolumeX, CheckCircle, User, Bot } from 'lucide-react';
import { ConversationMessage } from '@/types';

interface VoiceAgentInterfaceProps {
  onBack?: () => void;
}

export const VoiceAgentInterface: React.FC<VoiceAgentInterfaceProps> = ({ onBack }) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [agentResponse, setAgentResponse] = useState<string>('');
  const [consultationStep, setConsultationStep] = useState<'patient-input' | 'doctor-review' | 'prescription'>('patient-input');
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [showStepComplete, setShowStepComplete] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
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
  }>({});
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://your-livekit-server.com';

  // Auto-scroll to bottom of transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [conversationHistory]);

  // Audio level monitoring
  useEffect(() => {
    if (!isUserSpeaking || !analyserRef.current) {
      setAudioLevel(0);
      return;
    }

    const updateAudioLevel = () => {
      const dataArray = new Uint8Array(analyserRef.current!.frequencyBinCount);
      analyserRef.current!.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average);
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    };

    updateAudioLevel();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isUserSpeaking]);

  // Function to play AI agent's voice response
  const playAgentVoice = async (text: string) => {
    try {
      setIsAgentSpeaking(true);
      
      const response = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      const result = await response.json();
      
      if (result.success && result.audioBase64) {
        // Convert base64 to audio blob
        const audioData = atob(result.audioBase64);
        const audioArray = new Uint8Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
          audioArray[i] = audioData.charCodeAt(i);
        }
        
        const audioBlob = new Blob([audioArray], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Create and play audio
        if (audioPlayerRef.current) {
          audioPlayerRef.current.pause();
        }
        
        const audio = new Audio(audioUrl);
        audioPlayerRef.current = audio;
        
        audio.onended = () => {
          setIsAgentSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        audio.onerror = () => {
          setIsAgentSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          console.error('Error playing audio');
        };
        
        await audio.play();
      } else {
        setIsAgentSpeaking(false);
        console.error('TTS failed:', result.error);
      }
    } catch (error) {
      console.error('Error playing agent voice:', error);
      setIsAgentSpeaking(false);
    }
  };

  // Initialize LiveKit room with professional configuration
  useEffect(() => {
    const initializeRoom = async () => {
      try {
        const newRoom = new Room({
          adaptiveStream: true,
          dynacast: true,
          // LiveKit recommended audio capture settings for voice activity detection
          audioCaptureDefaults: {
            autoGainControl: true,
            echoCancellation: true,
            noiseSuppression: true,
          },
        });

        // Set up room event listeners
        newRoom.on(RoomEvent.ActiveSpeakersChanged, (speakers: any[]) => {
          const localParticipant = newRoom.localParticipant;
          const isLocalSpeaking = speakers.some(speaker => speaker.identity === localParticipant.identity);
          setIsUserSpeaking(isLocalSpeaking);
        });

        newRoom.on(RoomEvent.Disconnected, () => {
          setIsConnected(false);
          setConnectionStatus('disconnected');
          setIsUserSpeaking(false);
          setIsAgentSpeaking(false);
        });

        newRoom.on(RoomEvent.ConnectionStateChanged, (state) => {
          if (state === 'connected') {
            setConnectionStatus('connected');
          } else if (state === 'connecting') {
            setConnectionStatus('connecting');
          } else if (state === 'disconnected') {
            setConnectionStatus('disconnected');
          }
        });

        setRoom(newRoom);
      } catch (error) {
        console.error('Error initializing room:', error);
        setConnectionStatus('error');
        setErrorMessage('Failed to initialize voice connection');
      }
    };

    initializeRoom();

    return () => {
      if (room) {
        room.disconnect();
      }
      // Clean up audio player on unmount
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, []);

  const connectToAgent = async () => {
    if (!room) return;
    
    try {
      setLoading(true);
      setConnectionStatus('connecting');
      setErrorMessage('');
      
      const token = await generateRoomToken();
      await room.connect(LIVEKIT_URL, token);
      
      setIsConnected(true);
      setLoading(false);
      await enableContinuousAudio();
      
      // Initial greeting
      const greeting = "Hola, soy su asistente médico virtual. Estoy aquí para ayudarle con su consulta. ¿Cuáles son sus síntomas principales?";
      setAgentResponse(greeting);
      setConversationHistory(prev => [...prev, { role: 'assistant', text: greeting }]);
      await playAgentVoice(greeting);
      
    } catch (error) {
      console.error('Failed to connect to room:', error);
      setLoading(false);
      setConnectionStatus('error');
      setErrorMessage('Failed to connect to voice agent');
    }
  };

  const enableContinuousAudio = async () => {
    try {
      await room!.localParticipant.setMicrophoneEnabled(true);
      
      const microphonePublication = room!.localParticipant.getTrackPublication(Track.Source.Microphone);
      const stream = microphonePublication?.track?.mediaStream || 
        await navigator.mediaDevices.getUserMedia({ 
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
        });
      
      audioContextRef.current = new AudioContext();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      microphoneRef.current.connect(analyserRef.current);
      
      setupVoiceActivityDetection(stream);
    } catch (error) {
      console.error('Error enabling continuous audio:', error);
      setErrorMessage('Failed to enable microphone');
    }
  };

  const setupVoiceActivityDetection = (stream: MediaStream) => {
    let isRecording = false;
    let audioChunks: Blob[] = [];
    let mediaRecorder: MediaRecorder | null = null;
    let silenceTimeout: NodeJS.Timeout | null = null;
    let recordingStartTime: number = 0;
    let lastVoiceActivity: number = 0;
    let isProcessing = false;

    // Configuration for voice activity detection
    const SILENCE_DURATION = 3000; // 3 seconds of silence before stopping
    const MIN_RECORDING_DURATION = 2000; // Minimum 2 seconds of recording
    const MAX_RECORDING_DURATION = 30000; // Maximum 30 seconds of recording
    const AUDIO_LEVEL_THRESHOLD = 10; // Minimum audio level to consider as voice activity

    const startRecording = () => {
      if (isRecording || isProcessing) return;
      
      console.log('🎤 Starting voice recording...');
      isRecording = true;
      setIsRecording(true);
      recordingStartTime = Date.now();
      audioChunks = [];
      
      // Clear any existing silence timeout
      if (silenceTimeout) {
        clearTimeout(silenceTimeout);
        silenceTimeout = null;
      }
      
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        if (audioChunks.length > 0) {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const recordingDuration = Date.now() - recordingStartTime;
          
          // Only process if recording is long enough and has sufficient data
          if (audioBlob.size > 5000 && recordingDuration >= MIN_RECORDING_DURATION) {
            console.log(`🎤 Processing voice input (${recordingDuration}ms, ${audioBlob.size} bytes)`);
            isProcessing = true;
            await processVoiceInput(audioBlob);
            isProcessing = false;
          } else {
            console.log(`🎤 Skipping short recording (${recordingDuration}ms, ${audioBlob.size} bytes)`);
          }
        }
        isRecording = false;
        setIsRecording(false);
      };
      
      mediaRecorder.start();
    };

    const stopRecording = () => {
      if (!isRecording || !mediaRecorder) return;
      
      const recordingDuration = Date.now() - recordingStartTime;
      
      // Don't stop if recording is too short
      if (recordingDuration < MIN_RECORDING_DURATION) {
        console.log(`🎤 Recording too short (${recordingDuration}ms), continuing...`);
        return;
      }
      
      // Don't stop if recording is too long (force stop)
      if (recordingDuration >= MAX_RECORDING_DURATION) {
        console.log(`🎤 Recording too long (${recordingDuration}ms), forcing stop...`);
      }
      
      console.log(`🎤 Stopping voice recording (${recordingDuration}ms)`);
      mediaRecorder.stop();
    };

    const handleVoiceActivity = (isSpeaking: boolean) => {
      const now = Date.now();
      
      if (isSpeaking) {
        lastVoiceActivity = now;
        
        // Start recording if not already recording
        if (!isRecording && !isProcessing) {
          startRecording();
        }
        
        // Clear any existing silence timeout
        if (silenceTimeout) {
          clearTimeout(silenceTimeout);
          silenceTimeout = null;
        }
      } else if (isRecording) {
        // Set timeout to stop recording after silence
        if (silenceTimeout) {
          clearTimeout(silenceTimeout);
        }
        
        silenceTimeout = setTimeout(() => {
          const timeSinceLastActivity = now - lastVoiceActivity;
          if (timeSinceLastActivity >= SILENCE_DURATION) {
            stopRecording();
          }
        }, SILENCE_DURATION);
      }
    };

    if (room) {
      room.on(RoomEvent.ActiveSpeakersChanged, (speakers: any[]) => {
        const localParticipant = room.localParticipant;
        const isLocalSpeaking = speakers.some(speaker => speaker.identity === localParticipant.identity);
        handleVoiceActivity(isLocalSpeaking);
      });
    }
  };

  const processVoiceInput = async (audioBlob: Blob) => {
    try {
      setIsProcessing(true);
      
      // Convert Blob to base64 using FileReader (more efficient for large files)
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });
      
      const response = await fetch('/api/voice/continuous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioData: base64Audio,
          conversationHistory: conversationHistory,
          consultationStep: consultationStep,
          isText: false,
          sessionId: Date.now().toString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process voice input');
      }

      const result = await response.json();
      
      if (result.success) {
        setConversationHistory(prev => [...prev, { role: 'user', text: result.transcript }]);
        setConversationHistory(prev => [...prev, { role: 'assistant', text: result.response }]);
        setAgentResponse(result.response);
        
        // Play the AI agent's voice response
        await playAgentVoice(result.response);
        
        if (result.stepComplete) {
          setShowStepComplete(true);
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
      } else {
        throw new Error(result.error || 'Error processing voice input');
      }

    } catch (error) {
      console.error('Error processing voice input:', error);
      setAgentResponse('Error procesando voz. Inténtelo de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };



  const disconnectFromAgent = async () => {
    if (room) {
      await room.disconnect();
      setIsConnected(false);
      setConnectionStatus('disconnected');
      setAgentResponse('');
      setConsultationStep('patient-input');
      setConversationHistory([]);
      setIsUserSpeaking(false);
      setIsAgentSpeaking(false);
      setIsRecording(false);
      setErrorMessage('');
      
      // Clean up audio context
      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Clean up audio player
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    }
  };

  const toggleMute = async () => {
    if (!room) return;
    
    try {
      if (isMuted) {
        await room.localParticipant.setMicrophoneEnabled(true);
        setIsMuted(false);
      } else {
        await room.localParticipant.setMicrophoneEnabled(false);
        setIsMuted(true);
      }
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
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

  const sendTextMessage = async (message: string) => {
    if (!isConnected || !message.trim()) return;
    
    setLoading(true);
    setConversationHistory(prev => [...prev, { role: 'user', text: message }]);
    
    try {
      const response = await fetch('/api/voice/continuous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userText: message,
          conversationHistory: conversationHistory,
          consultationStep: consultationStep,
          isText: true,
          sessionId: Date.now().toString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process text message');
      }

      const result = await response.json();
      
      if (result.success) {
        setConversationHistory(prev => [...prev, { role: 'assistant', text: result.response }]);
        setAgentResponse(result.response);
        
        // Play the AI agent's voice response
        await playAgentVoice(result.response);
        
        if (result.stepComplete) {
          setShowStepComplete(true);
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
      } else {
        throw new Error(result.error || 'Error processing message');
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
    
    setStepHistories(prev => ({
      ...prev,
      [consultationStep]: [...conversationHistory]
    }));
    
    setConsultationStep(nextStep);
    setShowStepComplete(false);
    setConversationHistory([]);
    
    await generateStepSummary(nextStep);
  };

  const generateStepSummary = async (step: string) => {
    const stepMessages = {
      'doctor-review': {
        history: stepHistories['patient-input'],
        fallback: "Basándome en la información recopilada, procedo a realizar la evaluación médica. ¿Desea que proceda con el análisis médico?"
      },
      'prescription': {
        history: stepHistories['doctor-review'],
        fallback: "Basándome en la evaluación médica realizada, procedo a generar las recomendaciones y prescripción médica. ¿Desea que proceda con la prescripción?"
      }
    };

    const stepData = stepMessages[step as keyof typeof stepMessages];
    if (!stepData) return;

    try {
      const response = await fetch('/api/voice/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: step,
          conversationHistory: stepData.history
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setConversationHistory([{ role: 'assistant', text: result.summary }]);
          setAgentResponse(result.summary);
          await playAgentVoice(result.summary);
        }
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      setConversationHistory([{ role: 'assistant', text: stepData.fallback }]);
      setAgentResponse(stepData.fallback);
      await playAgentVoice(stepData.fallback);
    }
  };

  const getNextStep = (currentStep: string): 'patient-input' | 'doctor-review' | 'prescription' => {
    switch (currentStep) {
      case 'patient-input':
        return 'doctor-review';
      case 'doctor-review':
        return 'prescription';
      case 'prescription':
        return 'prescription';
      default:
        return 'patient-input';
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

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Conectado';
      case 'connecting': return 'Conectando...';
      case 'error': return 'Error';
      default: return 'Desconectado';
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
          {analysis.summary && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Resumen</h4>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-md">
                {analysis.summary}
              </p>
            </div>
          )}

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

          {analysis.urgency && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Nivel de Urgencia</h4>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(analysis.urgency)}`}>
                {analysis.urgency.toUpperCase()}
              </span>
            </div>
          )}

          {analysis.notes && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Notas Adicionales</h4>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-md">
                {analysis.notes}
              </p>
            </div>
          )}

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

          {recommendations.followUp && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Seguimiento</h4>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-md">
                {recommendations.followUp}
              </p>
            </div>
          )}

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
              <h1 className="text-2xl font-bold text-gray-900">Consulta Médica con IA</h1>
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
                  Finalizar
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
          {/* Voice Status Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Estado de la Voz</h2>
              
              {/* Connection Status */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Conexión</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor()} animate-pulse`}></div>
                    <span className="text-sm text-gray-600">{getConnectionStatusText()}</span>
                  </div>
                </div>
                {errorMessage && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-xs text-red-800">{errorMessage}</p>
                  </div>
                )}
              </div>

              {/* Voice Activity Indicator */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Actividad de Voz</span>
                  <div className="flex items-center space-x-2">
                    {isRecording && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-red-600">Grabando</span>
                      </div>
                    )}
                    {isUserSpeaking && !isRecording && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-600">Hablando</span>
                      </div>
                    )}
                    {isAgentSpeaking && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-blue-600">IA Respondiendo</span>
                      </div>
                    )}
                    {isConnected && !isUserSpeaking && !isAgentSpeaking && !isProcessing && !isRecording && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-yellow-600">Escuchando</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Audio Level Visualizer */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-100"
                    style={{ width: `${(audioLevel / 255) * 100}%` }}
                  ></div>
                </div>
                
                {/* Status Message */}
                <div className="mt-2 text-xs text-gray-500 text-center">
                  {isConnected ? 
                    (isRecording ? "🎤 Grabando voz..." :
                     isUserSpeaking ? "Detectando voz..." :
                     isAgentSpeaking ? "IA procesando respuesta..." :
                     isProcessing ? "Procesando consulta..." :
                     "Hable libremente - La IA detectará automáticamente su voz") :
                    "Conecte para comenzar la consulta de voz."
                  }
                </div>
              </div>

              {/* Voice Controls */}
              <div className="space-y-3">
                <button
                  onClick={toggleMute}
                  disabled={!isConnected}
                  className="w-full flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isMuted ? (
                    <>
                      <VolumeX className="w-4 h-4 mr-2" />
                      Activar Micrófono
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 mr-2" />
                      Silenciar
                    </>
                  )}
                </button>

                <div className="text-xs text-gray-500 text-center">
                  {isConnected ? 
                    "Hable libremente - La IA detectará automáticamente su voz." :
                    "Conecte para comenzar la consulta de voz."
                  }
                </div>
              </div>

              {/* Processing Status */}
              {isProcessing && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-blue-800">Procesando...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b bg-gray-50">
                <h2 className="text-xl font-semibold text-gray-900">Conversación Médica</h2>
                <p className="text-sm text-gray-600">Asistente de IA en español - Conversación continua</p>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={transcriptRef}>
                {conversationHistory.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Haz clic en &quot;Iniciar Consulta&quot; para comenzar</p>
                    <p className="text-sm mt-2">Puede hablar libremente o escribir mensajes</p>
                  </div>
                ) : (
                  conversationHistory.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="flex items-start space-x-2 max-w-xs lg:max-w-md">
                        {message.role === 'assistant' && (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <Bot className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div
                          className={`px-4 py-2 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                        </div>
                        {message.role === 'user' && (
                          <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <User className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                
                {loading && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="w-3 h-3 text-white" />
                      </div>
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
                  </div>
                )}
              </div>

              {/* Step Completion Notification */}
              {showStepComplete && (
                <div className="p-4 border-t bg-green-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-900">
                          Paso completado
                        </p>
                        <p className="text-xs text-green-700">
                          {getStepDescription()} - Listo para continuar
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={completeCurrentStep}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Continuar
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
                    placeholder="Escriba su mensaje aquí o hable libremente..."
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
                <p className="text-xs text-gray-500 mt-2">
                  Presione Enter para enviar o hable directamente al micrófono
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}; 