import React, { useState } from 'react';

interface DoctorReviewInterfaceProps {
  patientAnalysis: any;
  onComplete: (recommendations: any) => void;
  onLoading: (loading: boolean) => void;
}

export const DoctorReviewInterface: React.FC<DoctorReviewInterfaceProps> = ({
  patientAnalysis,
  onComplete,
  onLoading,
}) => {
  const [doctorNotes, setDoctorNotes] = useState('');
  const [urgency, setUrgency] = useState('medium');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!doctorNotes.trim()) {
      newErrors.doctorNotes = 'Las notas del médico son requeridas';
    } else if (doctorNotes.length < 5) {
      newErrors.doctorNotes = 'Las notas deben tener al menos 5 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onLoading(true);

    try {
      const response = await fetch('/api/ai/doctor-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientAnalysis: JSON.stringify(patientAnalysis),
          doctorNotes: doctorNotes,
          urgency: urgency,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onComplete(result.data);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error submitting doctor recommendations:', error);
      alert('Ocurrió un error al procesar tu solicitud.');
    } finally {
      onLoading(false);
    }
  };

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
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Patient Analysis Display */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Análisis del Paciente</h3>
          
          {patientAnalysis && (
            <div className="space-y-4">
              {/* Summary */}
              {patientAnalysis.summary && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Resumen</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-md">
                    {patientAnalysis.summary}
                  </p>
                </div>
              )}

              {/* Key Symptoms */}
              {patientAnalysis.keySymptoms && patientAnalysis.keySymptoms.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Síntomas Principales</h4>
                  <div className="flex flex-wrap gap-2">
                    {patientAnalysis.keySymptoms.map((symptom: string, index: number) => (
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
              {patientAnalysis.potentialConcerns && patientAnalysis.potentialConcerns.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Preocupaciones Potenciales</h4>
                  <div className="flex flex-wrap gap-2">
                    {patientAnalysis.potentialConcerns.map((concern: string, index: number) => (
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
              {patientAnalysis.recommendedNextSteps && patientAnalysis.recommendedNextSteps.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Próximos Pasos Recomendados</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    {patientAnalysis.recommendedNextSteps.map((step: string, index: number) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Urgency */}
              {patientAnalysis.urgency && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Nivel de Urgencia</h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(patientAnalysis.urgency)}`}>
                    {patientAnalysis.urgency.toUpperCase()}
                  </span>
                </div>
              )}

              {/* Additional Notes */}
              {patientAnalysis.notes && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Notas Adicionales</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-md">
                    {patientAnalysis.notes}
                  </p>
                </div>
              )}

              {/* Disclaimer */}
              {patientAnalysis.disclaimer && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    {patientAnalysis.disclaimer}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Doctor Review Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Revisión del Médico</h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Doctor Notes */}
            <div>
              <label htmlFor="doctorNotes" className="block text-sm font-medium text-gray-700 mb-2">
                Notas del Médico *
              </label>
              <textarea
                id="doctorNotes"
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.doctorNotes ? 'border-red-500' : 'border-gray-300'
                }`}
                rows={6}
                placeholder="Agrega tus observaciones clínicas, evaluación y consideraciones de tratamiento..."
              />
              {errors.doctorNotes && (
                <p className="mt-1 text-sm text-red-600">{errors.doctorNotes}</p>
              )}
            </div>

            {/* Urgency Level */}
            <div>
              <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-2">
                Nivel de Urgencia
              </label>
              <select
                id="urgency"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="emergency">Emergencia</option>
              </select>
            </div>

            {/* Clinical Guidelines */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="font-medium text-blue-900 mb-2">Clinical Guidelines</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Consider patient&apos;s age, gender, and medical history</li>
                <li>• Evaluate symptom severity and duration</li>
                <li>• Review current medications for interactions</li>
                <li>• Assess need for immediate intervention</li>
                <li>• Consider referral to specialists if needed</li>
              </ul>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                Generate Treatment Recommendations
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}; 