import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/ai/utils';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY not configured');
      return NextResponse.json({ 
        error: 'OpenAI API key not configured',
        success: false 
      }, { status: 500 });
    }

    console.log('🔊 Starting TTS conversion for text:', text.substring(0, 50) + '...');

    const openai = getOpenAI();
    const speechResponse = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text
    });

    // Convert the audio to base64 for sending to frontend
    const audioBuffer = Buffer.from(await speechResponse.arrayBuffer());
    const audioBase64 = audioBuffer.toString('base64');

    console.log('✅ TTS conversion completed');

    return NextResponse.json({
      audioBase64: audioBase64,
      success: true
    });

  } catch (error: any) {
    console.error('❌ Error in TTS conversion:', error);
    
    let errorMessage = 'Error converting text to speech';
    let statusCode = 500;
    
    if (error.code === 'unavailable' || error.message?.includes('timeout')) {
      errorMessage = 'Service temporarily unavailable. Please try again in a moment.';
      statusCode = 503;
    } else if (error.status === 429) {
      errorMessage = 'Too many requests. Please wait a moment before trying again.';
      statusCode = 429;
    } else if (error.status === 401) {
      errorMessage = 'Authentication error with AI service.';
      statusCode = 401;
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: statusCode });
  }
}
