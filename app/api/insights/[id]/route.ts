import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

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
            message: 'Insight ID must be a valid integer.',
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

    const insight = await prisma.insight.findUnique({
      where: { id },
    })

    if (!insight) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: `Insight with id ${id} not found.`,
          },
        },
        { status: 404 }
      )
    }

    if (insight.merchantId !== merchantId) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: `Insight ${id} does not belong to merchant ${merchantId}.`,
          },
        },
        { status: 403 }
      )
    }

    return NextResponse.json(insight)
  } catch (error: any) {
    console.error(`Error fetching insight:`, error)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred while fetching the insight.',
        },
      },
      { status: 500 }
    )
  }
}
