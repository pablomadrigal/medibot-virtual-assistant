'use client'

import { useState } from 'react'
import { Users, FileText, Clock, CheckCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

// Mock data for demonstration
const mockConsultations = [
  {
    id: '1',
    patientName: 'John Doe',
    dateOfBirth: '1985-06-15',
    reasonForVisit: 'Persistent headaches for the past week',
    symptoms: 'Severe headaches, sensitivity to light, occasional nausea',
    duration: '1 week',
    status: 'pending',
    createdAt: new Date('2024-01-15T10:30:00'),
    aiSummary: 'Patient presents with classic migraine symptoms including photophobia and associated nausea.',
    aiRecommendations: [
      'Consider migraine evaluation',
      'Review medication history',
      'Assess for triggers',
    ],
  },
  {
    id: '2',
    patientName: 'Jane Smith',
    dateOfBirth: '1990-03-22',
    reasonForVisit: 'Annual checkup',
    symptoms: 'No specific symptoms, routine wellness visit',
    duration: 'N/A',
    status: 'completed',
    createdAt: new Date('2024-01-14T14:15:00'),
    aiSummary: 'Routine wellness visit with no acute concerns reported.',
    aiRecommendations: [
      'Standard preventive care screening',
      'Update vaccinations if needed',
    ],
  },
]

export default function DoctorPage() {
  const [selectedConsultation, setSelectedConsultation] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')

  const filteredConsultations = mockConsultations.filter(consultation => {
    if (filter === 'all') return true
    return consultation.status === filter
  })

  const selectedConsultationData = mockConsultations.find(c => c.id === selectedConsultation)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning-100 text-warning-800'
      case 'completed':
        return 'bg-success-100 text-success-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Link
            href="/"
            className="mr-4 p-2 rounded-lg hover:bg-white/50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center">
            <Users className="h-8 w-8 text-medical-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
              <p className="text-gray-600">Review patient consultations and data</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Consultations List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold mb-3">Consultations</h2>
                
                {/* Filter Buttons */}
                <div className="flex space-x-2">
                  {(['all', 'pending', 'completed'] as const).map((filterOption) => (
                    <button
                      key={filterOption}
                      onClick={() => setFilter(filterOption)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        filter === filterOption
                          ? 'bg-medical-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {filteredConsultations.map((consultation) => (
                  <div
                    key={consultation.id}
                    onClick={() => setSelectedConsultation(consultation.id)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedConsultation === consultation.id ? 'bg-medical-50 border-medical-200' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{consultation.patientName}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {consultation.reasonForVisit.substring(0, 50)}...
                        </p>
                        <div className="flex items-center mt-2 space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {consultation.createdAt.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(consultation.status)}`}>
                        {consultation.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Consultation Details */}
          <div className="lg:col-span-2">
            {selectedConsultationData ? (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Consultation Details</h2>
                  <div className="flex space-x-2">
                    <button className="bg-medical-600 hover:bg-medical-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      Add Notes
                    </button>
                    <button className="bg-success-600 hover:bg-success-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark Complete
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Patient Information */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Patient Information</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Name:</span>
                        <p className="text-gray-900">{selectedConsultationData.patientName}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Date of Birth:</span>
                        <p className="text-gray-900">{selectedConsultationData.dateOfBirth}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Consultation Date:</span>
                        <p className="text-gray-900">
                          {selectedConsultationData.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Medical Information */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Medical Information</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Reason for Visit:</span>
                        <p className="text-gray-900">{selectedConsultationData.reasonForVisit}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Symptoms:</span>
                        <p className="text-gray-900">{selectedConsultationData.symptoms}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Duration:</span>
                        <p className="text-gray-900">{selectedConsultationData.duration}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Analysis */}
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-medium mb-3">AI Analysis</h3>
                  <div className="bg-medical-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-medical-800 mb-2">Summary</h4>
                    <p className="text-medical-700">{selectedConsultationData.aiSummary}</p>
                  </div>
                  <div className="bg-warning-50 rounded-lg p-4">
                    <h4 className="font-medium text-warning-800 mb-2">Recommendations</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedConsultationData.aiRecommendations.map((rec, index) => (
                        <li key={index} className="text-warning-700">{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Consultation</h3>
                <p className="text-gray-600">
                  Choose a consultation from the list to view detailed patient information and AI analysis.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}