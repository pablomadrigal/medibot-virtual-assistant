// Medical data validation utilities

export interface MedicalDataValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// Validate medical symptoms description
export function validateSymptoms(symptoms: string): MedicalDataValidation {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!symptoms || symptoms.trim().length === 0) {
    errors.push('Symptoms description is required')
  }
  
  if (symptoms.length < 10) {
    warnings.push('Symptoms description is very brief, consider adding more details')
  }
  
  if (symptoms.length > 2000) {
    errors.push('Symptoms description is too long (max 2000 characters)')
  }
  
  // Check for potentially concerning keywords
  const urgentKeywords = ['chest pain', 'difficulty breathing', 'severe pain', 'bleeding', 'unconscious']
  const hasUrgentSymptoms = urgentKeywords.some(keyword => 
    symptoms.toLowerCase().includes(keyword)
  )
  
  if (hasUrgentSymptoms) {
    warnings.push('Symptoms may indicate urgent medical attention needed')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Validate duration format and reasonableness
export function validateDuration(duration: string): MedicalDataValidation {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!duration || duration.trim().length === 0) {
    errors.push('Duration is required')
  }
  
  // Check for common duration patterns
  const durationPatterns = [
    /\d+\s*(minute|hour|day|week|month|year)s?/i,
    /\d+\s*(min|hr|d|w|m|y)/i,
    /(sudden|immediate|ongoing|chronic)/i
  ]
  
  const hasValidPattern = durationPatterns.some(pattern => pattern.test(duration))
  
  if (!hasValidPattern && duration.length > 0) {
    warnings.push('Duration format may be unclear, consider using standard time units')
  }
  
  // Check for extremely long durations that might need attention
  if (duration.toLowerCase().includes('year') || duration.toLowerCase().includes('chronic')) {
    warnings.push('Long-term symptoms may require specialized care')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Validate reason for visit
export function validateReasonForVisit(reason: string): MedicalDataValidation {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!reason || reason.trim().length === 0) {
    errors.push('Reason for visit is required')
  }
  
  if (reason.length < 5) {
    warnings.push('Reason for visit is very brief, consider adding more context')
  }
  
  if (reason.length > 1000) {
    errors.push('Reason for visit is too long (max 1000 characters)')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Comprehensive anamnesis validation
export function validateAnamnesisData(data: {
  reasonForVisit: string
  symptoms: string
  duration: string
}): MedicalDataValidation {
  const reasonValidation = validateReasonForVisit(data.reasonForVisit)
  const symptomsValidation = validateSymptoms(data.symptoms)
  const durationValidation = validateDuration(data.duration)
  
  const allErrors = [
    ...reasonValidation.errors,
    ...symptomsValidation.errors,
    ...durationValidation.errors
  ]
  
  const allWarnings = [
    ...reasonValidation.warnings,
    ...symptomsValidation.warnings,
    ...durationValidation.warnings
  ]
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  }
}