import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { simulateScenario } from '../../../services/simulation-engine'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Default merchantId to 1 if not provided in query
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

    // Call SimulationEngine
    const result = await simulateScenario({
      merchantId,
      productId: body.productId,
      changeType: body.changeType,
      newValue: body.newValue,
    })

    // Map to public DTO
    const response = {
      productId: result.productId,
      current: {
        price: result.baseline.price,
        orders: result.baseline.orders,
        revenue: result.baseline.revenue,
        contribution: result.baseline.contribution,
      },
      scenario: {
        price: result.scenario.price,
        projectedOrders: result.scenario.projectedOrders,
        projectedRevenue: result.scenario.projectedRevenue,
        projectedContribution: result.scenario.projectedContribution,
      },
      impact: {
        contributionDifference: result.impact.contributionDifference,
        contributionDifferencePercent: result.impact.contributionDifferencePercent,
        orderDifference: result.impact.ordersDifference,
        orderDifferencePercent: result.impact.ordersDifferencePercent,
      },
      model: result.model,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error in simulation route:', error)
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
