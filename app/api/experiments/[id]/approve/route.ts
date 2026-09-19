import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { approveExperiment } from '../../../../../services/experiment-engine'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr, 10)
    if (isNaN(id)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'Experiment ID must be a valid integer.',
          },
        },
        { status: 400 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const merchantIdParam = searchParams.get('merchantId')
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

    const experiment = await approveExperiment({
      experimentId: id,
      merchantId,
    })

    return NextResponse.json({
      id: experiment.id,
      status: experiment.status,
      approved: true,
      startedAt: experiment.startedAt,
    })
  } catch (error: any) {
    console.error(`Error approving experiment:`, error)
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
    if (error.message && error.message.includes('Invalid experiment transition')) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_STATE_TRANSITION',
            message: error.message,
          },
        },
        { status: 409 }
      )
    }
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred while approving the experiment.',
        },
      },
      { status: 500 }
    )
  }
}
