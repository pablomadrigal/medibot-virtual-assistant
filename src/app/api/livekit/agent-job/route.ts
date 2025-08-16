import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { roomName, participantName } = await req.json()

    if (!roomName || !participantName) {
      return NextResponse.json(
        { error: 'Missing roomName or participantName' },
        { status: 400 }
      )
    }

    const livekitUrl = process.env.LIVEKIT_URL
    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET

    if (!livekitUrl || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'LiveKit server credentials are not configured' },
        { status: 500 }
      )
    }

    // Create agent job using LiveKit Cloud API
    const agentJobResponse = await fetch(`${livekitUrl.replace('wss://', 'https://')}/twirp/livekit.agent.AgentService/CreateJob`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}:${apiSecret}`,
        'Content-Type': 'application/json',
        'X-LiveKit-Agent': 'true'
      },
      body: JSON.stringify({
        name: 'medical-consultation-agent',
        room_name: roomName,
        participant_name: participantName,
        metadata: JSON.stringify({
          agent_type: 'medical_consultation',
          language: 'es',
          consultation_step: 'patient_input'
        })
      })
    })

    if (!agentJobResponse.ok) {
      const errorText = await agentJobResponse.text()
      console.error('LiveKit agent job creation failed:', errorText)
      return NextResponse.json(
        { error: 'Failed to create agent job' },
        { status: 500 }
      )
    }

    const agentJob = await agentJobResponse.json()
    
    return NextResponse.json({
      jobId: agentJob.id,
      roomName,
      participantName,
      status: 'created'
    })

  } catch (err) {
    console.error('Error creating LiveKit agent job:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
