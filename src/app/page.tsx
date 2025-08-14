import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">Medical AI Assistant</h1>
            </div>
            <div className="flex space-x-4">
              <Link 
                href="/login" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Iniciar Sesión
              </Link>
              <Link 
                href="/signup" 
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Consulta Médica Gratuita con IA
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Obtén análisis médicos preliminares, recomendaciones de tratamiento y prescripciones 
            utilizando inteligencia artificial avanzada. Completamente gratuito y sin necesidad de registro.
          </p>
          
          {/* Free Consultation CTA */}
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-8 mb-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-green-800 mb-4">
              🎉 ¡Prueba Nuestra Consulta Gratuita!
            </h3>
            <p className="text-green-700 mb-6">
              No necesitas crear una cuenta. Simplemente ingresa los síntomas y obtén un análisis médico preliminar.
            </p>
            <Link 
              href="/consultation" 
              className="inline-block bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Iniciar Consulta Gratuita
            </Link>
            <p className="text-sm text-green-600 mt-3">
              ⚠️ Solo para fines informativos - Consulta siempre con un profesional de la salud
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-3xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Análisis con IA</h3>
              <p className="text-gray-600">
                Análisis médico preliminar basado en síntomas y descripción del paciente.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-3xl mb-4">👨‍⚕️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Recomendaciones</h3>
              <p className="text-gray-600">
                Recomendaciones de tratamiento y próximos pasos sugeridos.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-3xl mb-4">💊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Prescripciones</h3>
              <p className="text-gray-600">
                Generación de prescripciones médicas para descargar.
              </p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-16 bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Importante</h3>
            <p className="text-yellow-700">
              Este sistema de consulta médica con IA es solo para fines informativos y educativos. 
              No reemplaza la consulta con un profesional de la salud calificado. 
              Los resultados no constituyen un diagnóstico médico y deben ser revisados por un médico.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>Medical AI Assistant - Consulta Médica Gratuita con Inteligencia Artificial</p>
            <p className="mt-1">Solo para fines informativos. Siempre consulta con un profesional de la salud.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}