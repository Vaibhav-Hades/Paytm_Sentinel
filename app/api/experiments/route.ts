import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { createExperiment } from '../../../services/experiment-engine'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Default merchantId to 1 if not provided in query or body
    const searchParams = request.nextUrl.searchParams
    const merchantIdParam = searchParams.get('merchantId') || body.merchantId
    const merchantId = merchantIdParam ? parseInt(merchantIdParam, 10) : 1

    if (isNaN(merchantId)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'merchantId must be a valid integer.',
          },
        },
        { status: 400 }
      )
    }

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { plan: true },
    })

    if (!merchant) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: `Merchant with id ${merchantId} not found.`,
          },
        },
        { status: 404 }
      )
    }

    if (merchant.plan === 'FREE') {
      return NextResponse.json(
        {
          error: {
            code: 'FEATURE_NOT_AVAILABLE',
            message: 'This feature requires a STANDARD or PREMIUM subscription plan.',
          },
        },
        { status: 403 }
      )
    }

    const experiment = await createExperiment({
      merchantId,
      insightId: body.insightId,
      productId: body.productId,
      type: body.type,
      oldValue: body.oldValue,
      newValue: body.newValue,
      durationDays: body.durationDays,
      metric: body.metric,
    })

    return NextResponse.json(experiment)
  } catch (error: any) {
    console.error('Error creating experiment:', error)
    if (
      error.message &&
      (error.message.includes('not found') || error.message.includes('belong to'))
    ) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        },
        { status: 404 }
      )
    }
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_INPUT',
          message: error.message || 'Invalid input parameters.',
        },
      },
      { status: 400 }
    )
  }
}
