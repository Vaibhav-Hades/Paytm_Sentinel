import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { getExperimentResult } from '../../../../../services/experiment-engine'

export async function GET(
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

    const res = await getExperimentResult(id, merchantId)

    return NextResponse.json({
      experimentId: res.experiment.id,
      status: res.experiment.status,
      ...res.publicResult,
    })
  } catch (error: any) {
    console.error(`Error fetching experiment result:`, error)
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
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred while fetching the experiment result.',
        },
      },
      { status: 500 }
    )
  }
}
