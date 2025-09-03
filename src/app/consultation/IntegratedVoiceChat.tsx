'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  LiveKitRoom,
  useIsSpeaking, 
  useLocalParticipant, 
  useParticipants,
  useConnectionState,
  useSpeakingParticipants,
  useDataChannel,
  useRoomContext
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Phone, PhoneOff, MessageSquare, CheckCircle, User, Bot, Mic, MicOff } from 'lucide-react';
import { ConversationMessage } from '@/types';

interface IntegratedVoiceChatProps {
  onBack?: () => void;
}

const VoiceChatContent: React.FC<IntegratedVoiceChatProps> = ({ onBack }) => {
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const connectionState = useConnectionState();
  const isSpeaking = useIsSpeaking(localParticipant);
  const speakingParticipants = useSpeakingParticipants();
  const room = useRoomContext();
  
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [showStepComplete, setShowStepComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [consultationStep, setConsultationStep] = useState<'patient-input' | 'doctor-review' | 'prescription'>('patient-input');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string>('');
  
  const chatRef = useRef<HTMLDivElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://your-livekit-server.com';

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [conversationHistory]);

  // Update connection state based on LiveKit hook
  useEffect(() => {
    setIsConnected(connectionState === 'connected');
  }, [connectionState]);

  // Handle voice activity using LiveKit's built-in detection
  useEffect(() => {
    if (!isConnected || !localParticipant) return;

    const handleVoiceActivity = async () => {
      // Check if local participant is speaking
      const isLocalSpeaking = speakingParticipants.some(p => p.identity === localParticipant.identity);
      
      if (isLocalSpeaking && !isProcessing) {
        // Start processing when user starts speaking
        await processVoiceInput();
      }
    };

    handleVoiceActivity();
  }, [isSpeaking, speakingParticipants, isConnected, localParticipant, isProcessing]);

  // Play AI agent's voice response
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
        const audioData = atob(result.audioBase64);
        const audioArray = new Uint8Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
          audioArray[i] = audioData.charCodeAt(i);
        }
        
        const audioBlob = new Blob([audioArray], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
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

  const connectToAgent = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      
      const generatedToken = await generateRoomToken();
      setToken(generatedToken);
      
      setLoading(false);
      
      // Initial greeting will be handled after connection
      const greeting = "Hola, soy su asistente médico virtual. Estoy aquí para ayudarle con su consulta. ¿Cuáles son sus síntomas principales?";
      setConversationHistory(prev => [...prev, { role: 'assistant', text: greeting }]);
      await playAgentVoice(greeting);
      
    } catch (error) {
      console.error('Failed to connect to room:', error);
      setLoading(false);
      setErrorMessage('Failed to connect to voice agent');
    }
  };

  const processVoiceInput = async () => {
    try {
      setIsProcessing(true);
      
      // Get the current microphone stream from LiveKit
      const microphonePublication = localParticipant?.getTrackPublication(Track.Source.Microphone);
      const stream = microphonePublication?.track?.mediaStream;
      
      if (!stream) {
        console.error('No microphone stream available');
        setIsProcessing(false);
        return;
      }

      // Create a MediaRecorder to capture the audio
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : 'audio/webm' 
      });
      
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        if (audioChunks.length > 0) {
          const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
          await processAudioBlob(audioBlob, mediaRecorder.mimeType);
        }
      };
      
      // Record for a short duration to capture the voice input
      mediaRecorder.start();
      setTimeout(() => {
        mediaRecorder.stop();
      }, 1000); // Record for 1 second
      
    } catch (error) {
      console.error('Error processing voice input:', error);
      setIsProcessing(false);
    }
  };

  const processAudioBlob = async (audioBlob: Blob, mimeType: string = 'audio/webm') => {
    try {
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });
      
      console.log('📤 Sending conversation history:', conversationHistory);
      
      const response = await fetch('/api/voice/continuous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioData: base64Audio,
          audioMimeType: mimeType,
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
      
      console.log('📥 Received response:', result);
      
      if (result.success) {
        // Update conversation history atomically to ensure proper order
        setConversationHistory(prev => {
          const newHistory = [
            ...prev, 
            { role: 'user' as const, text: result.transcript },
            { role: 'assistant' as const, text: result.response }
          ];
          console.log('🔄 Updated conversation history:', newHistory);
          return newHistory;
        });
        
        await playAgentVoice(result.response);
        
        if (result.stepComplete) {
          setShowStepComplete(true);
        } else {
          setConsultationStep(result.nextStep);
        }
      } else {
        throw new Error(result.error || 'Error processing voice input');
      }

    } catch (error) {
      console.error('Error processing voice input:', error);
      setConversationHistory(prev => [...prev, { role: 'assistant', text: 'Error procesando voz. Inténtelo de nuevo.' }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const disconnectFromAgent = async () => {
    setToken('');
    setConsultationStep('patient-input');
    setConversationHistory([]);
    setErrorMessage('');
    
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
  };

  const toggleMute = async () => {
    if (!localParticipant) return;
    
    try {
      if (isMuted) {
        await localParticipant.setMicrophoneEnabled(true);
        setIsMuted(false);
      } else {
        await localParticipant.setMicrophoneEnabled(false);
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
    
    try {
      console.log('📤 Sending text message with history:', conversationHistory);
      
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
        // Update conversation history atomically to ensure proper order
        setConversationHistory(prev => [
          ...prev, 
          { role: 'user' as const, text: message },
          { role: 'assistant' as const, text: result.response }
        ]);
        
        await playAgentVoice(result.response);
        
        if (result.stepComplete) {
          setShowStepComplete(true);
        } else {
          setConsultationStep(result.nextStep);
        }
      } else {
        throw new Error(result.error || 'Error processing message');
      }

    } catch (error) {
      console.error('Error processing text message:', error);
      setConversationHistory(prev => [...prev, { role: 'assistant', text: 'Error procesando mensaje. Inténtelo de nuevo.' }]);
    } finally {
      setLoading(false);
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
    switch (connectionState) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-gray-500';
      default: return 'bg-red-500';
    }
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg h-[700px] flex flex-col">
          {/* Chat Header with Voice Status */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Conversación Médica</h2>
                <p className="text-sm text-gray-600">Asistente de IA en español - Voz y texto integrados</p>
              </div>
              
              {/* Voice Status Indicators */}
              <div className="flex items-center space-x-4">
                {/* Connection Status */}
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor()} animate-pulse`}></div>
                  <span className="text-sm text-gray-600">
                    {connectionState === 'connected' ? 'Conectado' : 
                     connectionState === 'connecting' ? 'Conectando...' : 
                     connectionState === 'disconnected' ? 'Desconectado' : 'Error'}
                  </span>
                </div>

                {/* Voice Activity */}
                {isConnected && (
                  <div className="flex items-center space-x-2">
                    {isSpeaking && !isProcessing && (
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
                    {!isSpeaking && !isAgentSpeaking && !isProcessing && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-yellow-600">Escuchando</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Mute Button */}
                {isConnected && (
                  <button
                    onClick={toggleMute}
                    className={`p-2 rounded-lg transition-colors ${
                      isMuted 
                        ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                    }`}
                    title={isMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-xs text-red-800">{errorMessage}</p>
              </div>
            )}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatRef}>
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

            {/* Processing Status */}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                  <div className="bg-blue-50 text-blue-900 px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm">Procesando voz...</span>
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
                  onClick={() => setShowStepComplete(false)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Continuar
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
      </main>
    </div>
  );
};

export const IntegratedVoiceChat: React.FC<IntegratedVoiceChatProps> = ({ onBack }) => {
  return (
    <LiveKitRoom
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://your-livekit-server.com'}
      token=""
      connect={false}
    >
      <VoiceChatContent onBack={onBack} />
    </LiveKitRoom>
  );
};
