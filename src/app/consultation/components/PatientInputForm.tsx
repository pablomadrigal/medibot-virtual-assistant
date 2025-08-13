import React, { useState } from 'react';

interface PatientInputFormProps {
  onComplete: (analysis: any) => void;
  onLoading: (loading: boolean) => void;
}

export const PatientInputForm: React.FC<PatientInputFormProps> = ({ onComplete, onLoading }) => {
  const [formData, setFormData] = useState({
    patientDescription: '',
    patientAge: '',
    patientGender: '',
    symptoms: [] as string[],
    medicalHistory: '',
    currentMedications: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newSymptom, setNewSymptom] = useState('');
  const [newMedication, setNewMedication] = useState('');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.patientDescription.trim()) {
      newErrors.patientDescription = 'La descripción del paciente es requerida';
    } else if (formData.patientDescription.length < 10) {
      newErrors.patientDescription = 'La descripción debe tener al menos 10 caracteres';
    }

    if (formData.patientAge && (parseInt(formData.patientAge) < 0 || parseInt(formData.patientAge) > 120)) {
      newErrors.patientAge = 'La edad debe estar entre 0 y 120 años';
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
      const response = await fetch('/api/ai/patient-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientDescription: formData.patientDescription,
          patientAge: formData.patientAge ? parseInt(formData.patientAge) : undefined,
          patientGender: formData.patientGender || undefined,
          symptoms: formData.symptoms.length > 0 ? formData.symptoms : undefined,
          medicalHistory: formData.medicalHistory || undefined,
          currentMedications: formData.currentMedications.length > 0 ? formData.currentMedications : undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onComplete(result.data);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error submitting patient analysis:', error);
      alert('Ocurrió un error al procesar tu solicitud.');
    } finally {
      onLoading(false);
    }
  };

  const addSymptom = () => {
    if (newSymptom.trim() && !formData.symptoms.includes(newSymptom.trim())) {
      setFormData(prev => ({
        ...prev,
        symptoms: [...prev.symptoms, newSymptom.trim()]
      }));
      setNewSymptom('');
    }
  };

  const removeSymptom = (index: number) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.filter((_, i) => i !== index)
    }));
  };

  const addMedication = () => {
    if (newMedication.trim() && !formData.currentMedications.includes(newMedication.trim())) {
      setFormData(prev => ({
        ...prev,
        currentMedications: [...prev.currentMedications, newMedication.trim()]
      }));
      setNewMedication('');
    }
  };

  const removeMedication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      currentMedications: prev.currentMedications.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Información del Paciente</h2>
          <p className="text-gray-600">Por favor proporciona información detallada sobre la condición del paciente.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Description */}
          <div>
            <label htmlFor="patientDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción del Paciente *
            </label>
            <textarea
              id="patientDescription"
              value={formData.patientDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, patientDescription: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.patientDescription ? 'border-red-500' : 'border-gray-300'
              }`}
              rows={4}
              placeholder="Describe los síntomas del paciente, preocupaciones y cualquier detalle relevante..."
            />
            {errors.patientDescription && (
              <p className="mt-1 text-sm text-red-600">{errors.patientDescription}</p>
            )}
          </div>

          {/* Age and Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="patientAge" className="block text-sm font-medium text-gray-700 mb-2">
                Edad
              </label>
              <input
                type="number"
                id="patientAge"
                value={formData.patientAge}
                onChange={(e) => setFormData(prev => ({ ...prev, patientAge: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.patientAge ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ingresa la edad"
                min="0"
                max="120"
              />
              {errors.patientAge && (
                <p className="mt-1 text-sm text-red-600">{errors.patientAge}</p>
              )}
            </div>

            <div>
              <label htmlFor="patientGender" className="block text-sm font-medium text-gray-700 mb-2">
                Género
              </label>
              <select
                id="patientGender"
                value={formData.patientGender}
                onChange={(e) => setFormData(prev => ({ ...prev, patientGender: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar género</option>
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
                <option value="other">Otro</option>
              </select>
            </div>
          </div>

          {/* Symptoms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Síntomas
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newSymptom}
                onChange={(e) => setNewSymptom(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Agregar un síntoma"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSymptom())}
              />
              <button
                type="button"
                onClick={addSymptom}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Agregar
              </button>
            </div>
            {formData.symptoms.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.symptoms.map((symptom, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {symptom}
                    <button
                      type="button"
                      onClick={() => removeSymptom(index)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Medical History */}
          <div>
            <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700 mb-2">
              Historial Médico
            </label>
            <textarea
              id="medicalHistory"
              value={formData.medicalHistory}
              onChange={(e) => setFormData(prev => ({ ...prev, medicalHistory: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Cualquier historial médico relevante, condiciones previas o historial familiar..."
            />
          </div>

          {/* Current Medications */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medicamentos Actuales
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newMedication}
                onChange={(e) => setNewMedication(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Agregar un medicamento"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMedication())}
              />
              <button
                type="button"
                onClick={addMedication}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Agregar
              </button>
            </div>
            {formData.currentMedications.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.currentMedications.map((medication, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                  >
                    {medication}
                    <button
                      type="button"
                      onClick={() => removeMedication(index)}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              Analizar Información del Paciente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 