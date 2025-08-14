
import { NextResponse } from 'next/server';

export function mockNextResponseJson() {
  jest.spyOn(NextResponse, 'json').mockImplementation((body, init) => {
    return new Response(JSON.stringify(body), {
      ...init,
      headers: {
        ...init?.headers,
        'Content-Type': 'application/json',
      },
    });
  });
}
