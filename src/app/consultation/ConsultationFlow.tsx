import React, { useState } from 'react';
import { PatientInputForm } from './components/PatientInputForm';
import { DoctorReviewInterface } from './components/DoctorReviewInterface';
import { PrescriptionDisplay } from './components/PrescriptionDisplay';

export type ConsultationStep = 'patient-input' | 'doctor-review' | 'prescription';

export interface ConsultationData {
  patientAnalysis?: any;
  doctorRecommendations?: any;
  prescription?: any;
}

export const ConsultationFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<ConsultationStep>('patient-input');
  const [consultationData, setConsultationData] = useState<ConsultationData>({});
  const [loading, setLoading] = useState(false);

  const handlePatientAnalysisComplete = (analysis: any) => {
    setConsultationData(prev => ({ ...prev, patientAnalysis: analysis }));
    setCurrentStep('doctor-review');
  };

  const handleDoctorReviewComplete = (recommendations: any) => {
    setConsultationData(prev => ({ ...prev, doctorRecommendations: recommendations }));
    setCurrentStep('prescription');
  };

  const handlePrescriptionComplete = (prescription: any) => {
    setConsultationData(prev => ({ ...prev, prescription }));
    // Consultation complete
  };

  const resetConsultation = () => {
    setCurrentStep('patient-input');
    setConsultationData({});
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Consulta Médica con IA</h1>
              <span className="ml-4 px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                {currentStep === 'patient-input' && 'Paso 1: Información del Paciente'}
                {currentStep === 'doctor-review' && 'Paso 2: Revisión del Médico'}
                {currentStep === 'prescription' && 'Paso 3: Prescripción'}
              </span>
            </div>
            <button
              onClick={resetConsultation}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Iniciar Nueva Consulta
            </button>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center">
              <div className={`flex-1 h-2 rounded-full ${currentStep === 'patient-input' ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mx-2 ${
                currentStep === 'patient-input' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <div className={`flex-1 h-2 rounded-full ${currentStep === 'doctor-review' ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mx-2 ${
                currentStep === 'doctor-review' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <div className={`flex-1 h-2 rounded-full ${currentStep === 'prescription' ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mx-2 ${
                currentStep === 'prescription' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-lg">Procesando...</span>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'patient-input' && (
          <PatientInputForm
            onComplete={handlePatientAnalysisComplete}
            onLoading={setLoading}
          />
        )}

        {currentStep === 'doctor-review' && (
          <DoctorReviewInterface
            patientAnalysis={consultationData.patientAnalysis}
            onComplete={handleDoctorReviewComplete}
            onLoading={setLoading}
          />
        )}

        {currentStep === 'prescription' && (
          <PrescriptionDisplay
            doctorRecommendations={consultationData.doctorRecommendations}
            onComplete={handlePrescriptionComplete}
            onLoading={setLoading}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>Este sistema de consulta médica con IA es solo para fines informativos.</p>
            <p className="mt-1">Siempre consulta con un proveedor de atención médica calificado para consejos médicos.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}; 