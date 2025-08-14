'use client';

import React, { useState } from 'react';
import { ConsultationFlow } from './ConsultationFlow';
import { VoiceAgentInterface } from './VoiceAgentInterface';
import { Mic, FileText } from 'lucide-react';

type ConsultationMode = 'form' | 'voice';

export default function ConsultationPage() {
  const [mode, setMode] = useState<ConsultationMode | null>(null);

  if (mode === 'form') {
    return <ConsultationFlow onBack={() => setMode(null)} />;
  }

  if (mode === 'voice') {
    return <VoiceAgentInterface onBack={() => setMode(null)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Free Consultation Notice */}
      <div className="bg-green-50 border-b border-green-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="text-center">
            <p className="text-green-800 font-medium">
              🎉 <strong>Consulta Médica Gratuita</strong> - No requiere registro ni cuenta
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900 text-center">
              Consulta Médica Gratuita con IA
            </h1>
            <p className="text-gray-600 text-center mt-2">
              Elige tu método preferido para la consulta médica
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Form-based Consultation */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Consulta por Formulario
              </h2>
              <p className="text-gray-600 mb-6">
                Completa formularios paso a paso para recibir análisis médico detallado y recomendaciones personalizadas.
              </p>
              <ul className="text-left text-sm text-gray-600 mb-6 space-y-2">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                  Formularios estructurados y fáciles de usar
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                  Análisis médico detallado
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                  Recomendaciones de tratamiento
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                  Prescripción médica completa
                </li>
              </ul>
              <button
                onClick={() => setMode('form')}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Iniciar Consulta por Formulario
              </button>
            </div>
          </div>

          {/* Voice-based Consultation */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mic className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Consulta por Voz
              </h2>
              <p className="text-gray-600 mb-6">
                Habla directamente con nuestro agente de IA médico para una consulta más natural e interactiva.
              </p>
              <ul className="text-left text-sm text-gray-600 mb-6 space-y-2">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-600 rounded-full mr-3"></span>
                  Conversación natural en español
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-600 rounded-full mr-3"></span>
                  Reconocimiento de voz avanzado
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-600 rounded-full mr-3"></span>
                  Respuestas de voz en tiempo real
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-600 rounded-full mr-3"></span>
                  Consulta completa por voz
                </li>
              </ul>
              <button
                onClick={() => setMode('voice')}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Iniciar Consulta por Voz
              </button>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
            Información Importante
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-yellow-600 font-bold text-lg">⚠️</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Solo Informativo</h4>
              <p className="text-sm text-gray-600">
                Este sistema es solo para fines informativos y no reemplaza la consulta médica profesional.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold text-lg">🆓</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Completamente Gratuito</h4>
              <p className="text-sm text-gray-600">
                No requiere registro, cuenta o pago. Acceso inmediato a la consulta médica.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 font-bold text-lg">🔒</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Privacidad Garantizada</h4>
              <p className="text-sm text-gray-600">
                Tu información médica se mantiene privada y segura durante toda la consulta.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-2">⚠️ Consulta Médica Gratuita - Solo para Fines Informativos</p>
            <p>Este sistema de consulta médica con IA es completamente gratuito y solo para fines informativos.</p>
            <p className="mt-1">No requiere registro ni cuenta. Sin embargo, siempre consulta con un proveedor de atención médica calificado para consejos médicos reales.</p>
            <p className="mt-2 text-xs text-gray-400">Los resultados no son un diagnóstico médico y no reemplazan la consulta con un profesional de la salud.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 