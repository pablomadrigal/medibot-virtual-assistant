
import { NextResponse } from 'next/server';

export function mockNextResponseJson() {
  jest.spyOn(NextResponse, 'json').mockImplementation((body, init) => {
    return NextResponse.json(body, init);
  });
}
