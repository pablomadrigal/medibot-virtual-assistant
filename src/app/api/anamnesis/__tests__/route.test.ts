import 'whatwg-fetch';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import request from 'supertest';
import { POST } from '../route';
import { AnamnesisRepository } from '@/repositories/AnamnesisRepository';
import { PatientRepository } from '@/repositories/PatientRepository';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { mockNextResponseJson } from '../../__tests__/test-utils';

jest.mock('@/repositories/AnamnesisRepository');
jest.mock('@/repositories/PatientRepository');
jest.mock('@/lib/supabase/server');

const mockSupabase = createServerSupabaseClient as jest.Mock;
const validUUID = '123e4567-e89b-12d3-a456-426614174000';

describe('/api/anamnesis', () => {
    beforeEach(() => {
      mockNextResponseJson();
      jest.clearAllMocks();
      mockSupabase.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: validUUID } }, error: null }),
        },
      });
    });
  
    describe('POST', () => {
      it('should create a new anamnesis record when authenticated and authorized', async () => {
        (PatientRepository.exists as jest.Mock).mockResolvedValue(true);
        (AnamnesisRepository.create as jest.Mock).mockResolvedValue({ id: 'new-anamnesis-id' });
  
        const request = {
          json: async () => ({
            patientId: validUUID,
            reasonForVisit: 'Fever',
            symptoms: 'High temperature',
            duration: '2 days',
          }),
        } as unknown as NextRequest;

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(201);
        expect(body.data.id).toBe('new-anamnesis-id');
      });
  
      it('should return 403 if user tries to create anamnesis for another patient', async () => {
          mockSupabase.mockReturnValue({
              auth: {
                getUser: jest.fn().mockResolvedValue({
                  data: { user: { id: 'another-user-id' } }, // Authenticated as a different user
                  error: null,
                }),
              },
            });

        const request = {
          json: async () => ({
            patientId: validUUID,
            reasonForVisit: 'Fever',
            symptoms: 'High temperature',
            duration: '2 days',
          }),
        } as unknown as NextRequest;

        const response = await POST(request);
        
        expect(response.status).toBe(403);
        });
    });
  });