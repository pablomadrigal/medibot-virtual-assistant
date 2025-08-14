import { NextRequest } from 'next/server';
import { GET as aiControllerGet } from '../route';
import { GET as patientAnalysisGet } from '../patient-analysis/route';
import { GET as doctorRecommendationsGet } from '../doctor-recommendations/route';
import { GET as prescriptionGet } from '../prescription/route';

describe('AI Endpoints Basic Tests', () => {
  describe('AI Controller', () => {
    it('should return endpoint information', async () => {
      const response = await aiControllerGet();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('AI Controller is running');
      expect(data.endpoints).toContain('patient-analysis');
      expect(data.endpoints).toContain('doctor-recommendations');
      expect(data.endpoints).toContain('prescription');
    });
  });

  describe('Patient Analysis Endpoint', () => {
    it('should return endpoint information', async () => {
      const response = await patientAnalysisGet();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Patient Analysis endpoint is running');
      expect(data.requiredFields).toContain('patientDescription (string, min 10 chars)');
    });
  });

  describe('Doctor Recommendations Endpoint', () => {
    it('should return endpoint information', async () => {
      const response = await doctorRecommendationsGet();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Doctor Recommendations endpoint is running');
      expect(data.requiredFields).toContain('patientAnalysis (string, min 10 chars)');
      expect(data.requiredFields).toContain('doctorNotes (string, min 5 chars, max 1000 chars)');
    });
  });

  describe('Prescription Endpoint', () => {
    it('should return endpoint information', async () => {
      const response = await prescriptionGet();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Prescription Generation endpoint is running');
      expect(data.requiredFields).toContain('doctorRecommendations (string, min 10 chars)');
    });
  });
}); 