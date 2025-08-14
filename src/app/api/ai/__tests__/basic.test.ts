import { GET as aiControllerGet } from '../route';
import { mockNextResponseJson } from '../../__tests__/test-utils';

describe('AI Endpoints Basic Tests', () => {
  beforeEach(() => {
    mockNextResponseJson();
  });

  it('AI Controller › should return endpoint information', async () => {
    const response = await aiControllerGet();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('AI Controller is running');
  });
}); 