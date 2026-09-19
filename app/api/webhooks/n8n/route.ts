import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Missing or invalid Authorization header.',
          },
        },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const secret = process.env.N8N_WEBHOOK_SECRET

    if (!secret || token !== secret) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid bearer token.',
          },
        },
        { status: 401 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json(
        {
          error: {
            code: 'BAD_REQUEST',
            message: 'Malformed JSON payload.',
          },
        },
        { status: 400 }
      )
    }

    const { event, experimentId, timestamp } = body

    if (!event) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'Missing event property.',
          },
        },
        { status: 400 }
      )
    }

    const supportedEvents = ['EXPERIMENT_CHECK', 'EXPERIMENT_COMPLETE', 'INSIGHT_REFRESH']
    if (!supportedEvents.includes(event)) {
      return NextResponse.json(
        {
          error: {
            code: 'UNSUPPORTED_EVENT',
            message: `Event ${event} is not supported.`,
          },
        },
        { status: 400 }
      )
    }

    // Since this is just the webhook contract layer for MVP, we'll return success.
    // Real implementation would trigger actual business logic here.
    return NextResponse.json({
      success: true,
      event,
      receivedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error in n8n webhook:', error)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred processing the webhook.',
        },
      },
      { status: 500 }
    )
  }
}
