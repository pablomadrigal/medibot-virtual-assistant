import Link from 'next/link'
import { Stethoscope, Users, MessageSquare, Shield } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-medical-50 to-medical-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Stethoscope className="h-12 w-12 text-medical-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">MediBot</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Asistente virtual con IA que optimiza la admisión de pacientes y mejora la eficiencia de la atención médica
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <MessageSquare className="h-12 w-12 text-medical-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Chat del Paciente</h3>
            <p className="text-gray-600">
              Flujo de conversación interactivo para recopilar información del paciente eficientemente
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <Users className="h-12 w-12 text-medical-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Panel del Médico</h3>
            <p className="text-gray-600">
              Interfaz integral para revisar datos de pacientes y consultas
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <Shield className="h-12 w-12 text-medical-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Cumple con HIPAA</h3>
            <p className="text-gray-600">
              Manejo seguro de datos con encriptación y registro integral de auditoría
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/consultation"
            className="bg-medical-600 hover:bg-medical-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors text-center"
          >
            Consulta Médica con IA
          </Link>
          <Link
            href="/patient"
            className="bg-white hover:bg-gray-50 text-medical-600 border-2 border-medical-600 px-8 py-3 rounded-lg font-semibold transition-colors text-center"
          >
            Panel del Paciente
          </Link>
          <Link
            href="/doctor"
            className="bg-white hover:bg-gray-50 text-medical-600 border-2 border-medical-600 px-8 py-3 rounded-lg font-semibold transition-colors text-center"
          >
            Acceso del Médico
          </Link>
        </div>

        {/* Status */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500">
            Estado del Sistema: <span className="text-success-600 font-semibold">En Línea</span>
          </p>
        </div>
      </div>
    </main>
  )
}