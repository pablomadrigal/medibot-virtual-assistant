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
            AI-powered virtual assistant that streamlines patient intake and improves healthcare efficiency
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <MessageSquare className="h-12 w-12 text-medical-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Patient Chat</h3>
            <p className="text-gray-600">
              Interactive conversation flow to collect patient information efficiently
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <Users className="h-12 w-12 text-medical-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Doctor Dashboard</h3>
            <p className="text-gray-600">
              Comprehensive interface for reviewing patient data and consultations
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <Shield className="h-12 w-12 text-medical-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">HIPAA Compliant</h3>
            <p className="text-gray-600">
              Secure data handling with encryption and comprehensive audit logging
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/consultation"
            className="bg-medical-600 hover:bg-medical-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors text-center"
          >
            AI Medical Consultation
          </Link>
          <Link
            href="/patient"
            className="bg-white hover:bg-gray-50 text-medical-600 border-2 border-medical-600 px-8 py-3 rounded-lg font-semibold transition-colors text-center"
          >
            Patient Dashboard
          </Link>
          <Link
            href="/doctor"
            className="bg-white hover:bg-gray-50 text-medical-600 border-2 border-medical-600 px-8 py-3 rounded-lg font-semibold transition-colors text-center"
          >
            Doctor Login
          </Link>
        </div>

        {/* Status */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500">
            System Status: <span className="text-success-600 font-semibold">Online</span>
          </p>
        </div>
      </div>
    </main>
  )
}