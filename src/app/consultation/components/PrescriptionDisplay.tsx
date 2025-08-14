import React, { useState } from 'react';

interface PrescriptionDisplayProps {
  doctorRecommendations: any;
  onComplete: (prescription: any) => void;
  onLoading: (loading: boolean) => void;
}

export const PrescriptionDisplay: React.FC<PrescriptionDisplayProps> = ({
  doctorRecommendations,
  onComplete,
  onLoading,
}) => {
  const [additionalContext, setAdditionalContext] = useState('');
  const [prescriptionType, setPrescriptionType] = useState('medication');

  const handleGeneratePrescription = async () => {
    onLoading(true);

    try {
      const response = await fetch('/api/ai/prescription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctorRecommendations: doctorRecommendations,
          additionalContext: additionalContext || undefined,
          prescriptionType: prescriptionType,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onComplete(result.data);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error generating prescription:', error);
      alert('Ocurrió un error al generar la prescripción.');
    } finally {
      onLoading(false);
    }
  };

  const downloadPrescription = (prescription: any) => {
    const content = `
PRESCRIPTION

Date: ${prescription.prescription?.header?.date || new Date().toISOString().split('T')[0]}
Doctor: ${prescription.prescription?.header?.doctorName || 'Dr. [Name]'}
License: ${prescription.prescription?.header?.licenseNumber || 'LIC-XXXXX'}

MEDICATIONS:
${prescription.prescription?.medications?.map((med: any) => 
  `${med.name} - ${med.dosage} - ${med.frequency} - ${med.duration}`
).join('\n') || 'No medications prescribed'}

INSTRUCTIONS:
${prescription.prescription?.instructions || 'Follow doctor\'s instructions'}

WARNINGS:
${prescription.prescription?.warnings?.join('\n') || 'No specific warnings'}

FOLLOW-UP:
${prescription.prescription?.followUp || 'Schedule follow-up as recommended'}

DISCLAIMER:
${prescription.disclaimer || 'This prescription is for informational purposes only'}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prescription-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Doctor Recommendations Display */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Recomendaciones de Tratamiento</h3>
          
          {doctorRecommendations && (
            <div className="space-y-4">
              {/* Treatment Plan */}
              {doctorRecommendations.treatmentPlan && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Recomendaciones Principales</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    {doctorRecommendations.treatmentPlan.primaryRecommendations?.map((rec: string, index: number) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Medications */}
              {doctorRecommendations.treatmentPlan?.medications && doctorRecommendations.treatmentPlan.medications.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Medicamentos</h4>
                  <div className="space-y-3">
                    {doctorRecommendations.treatmentPlan.medications.map((med: any, index: number) => (
                      <div key={index} className="bg-blue-50 p-3 rounded-md">
                        <div className="font-medium text-blue-900">{med.name}</div>
                        <div className="text-sm text-blue-700">
                          <div>Dosis: {med.dosage}</div>
                          <div>Frecuencia: {med.frequency}</div>
                          <div>Duración: {med.duration}</div>
                          {med.notes && <div>Notas: {med.notes}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Examinations */}
              {doctorRecommendations.treatmentPlan?.examinations && doctorRecommendations.treatmentPlan.examinations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Exámenes Recomendados</h4>
                  <div className="space-y-2">
                    {doctorRecommendations.treatmentPlan.examinations.map((exam: any, index: number) => (
                      <div key={index} className="bg-green-50 p-3 rounded-md">
                        <div className="font-medium text-green-900">{exam.type}</div>
                        <div className="text-sm text-green-700">
                          <div>Razón: {exam.reason}</div>
                          <div>Urgencia: {exam.urgency}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lifestyle Recommendations */}
              {doctorRecommendations.treatmentPlan?.lifestyleRecommendations && doctorRecommendations.treatmentPlan.lifestyleRecommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Recomendaciones de Estilo de Vida</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    {doctorRecommendations.treatmentPlan.lifestyleRecommendations.map((rec: string, index: number) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Follow-up */}
              {doctorRecommendations.treatmentPlan?.followUp && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Seguimiento</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-md">
                    {doctorRecommendations.treatmentPlan.followUp}
                  </p>
                </div>
              )}

              {/* Safety Considerations */}
              {doctorRecommendations.safetyConsiderations && doctorRecommendations.safetyConsiderations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Consideraciones de Seguridad</h4>
                  <div className="flex flex-wrap gap-2">
                    {doctorRecommendations.safetyConsiderations.map((consideration: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm"
                      >
                        {consideration}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Contraindications */}
              {doctorRecommendations.contraindications && doctorRecommendations.contraindications.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Contraindicaciones</h4>
                  <div className="flex flex-wrap gap-2">
                    {doctorRecommendations.contraindications.map((contraindication: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                      >
                        {contraindication}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Prescription Generation */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Generar Prescripción</h3>
          
          <div className="space-y-6">
            {/* Prescription Type */}
            <div>
              <label htmlFor="prescriptionType" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Prescripción
              </label>
              <select
                id="prescriptionType"
                value={prescriptionType}
                onChange={(e) => setPrescriptionType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="medication">Medicamento</option>
                <option value="examination">Examen</option>
                <option value="referral">Derivación</option>
                <option value="lifestyle">Estilo de Vida</option>
              </select>
            </div>

            {/* Additional Context */}
            <div>
              <label htmlFor="additionalContext" className="block text-sm font-medium text-gray-700 mb-2">
                Contexto Adicional (Opcional)
              </label>
              <textarea
                id="additionalContext"
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Agrega cualquier contexto adicional para la prescripción..."
              />
            </div>

            {/* Generate Button */}
            <div>
              <button
                onClick={handleGeneratePrescription}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                Generar Prescripción
              </button>
            </div>

            {/* Prescription Guidelines */}
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <h4 className="font-medium text-green-900 mb-2">Directrices de Prescripción</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Revisa todos los medicamentos para interacciones</li>
                <li>• Asegura instrucciones de dosificación adecuadas</li>
                <li>• Incluye advertencias y efectos secundarios necesarios</li>
                <li>• Especifica duración e información de reabastecimiento</li>
                <li>• Agrega cualquier instrucción especial para el paciente</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 