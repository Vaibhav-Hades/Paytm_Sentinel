import { NextRequest, NextResponse } from 'next/server'
import { calculateMerchantMetrics } from '../../../../services/economic-engine'

export async function GET(request: NextRequest) {
  try {
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

    const periodParam = searchParams.get('period') || 'LAST_7_DAYS'
    if (periodParam !== 'LAST_7_DAYS' && periodParam !== 'LAST_30_DAYS') {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'period must be LAST_7_DAYS or LAST_30_DAYS.',
          },
        },
        { status: 400 }
      )
    }

    const metrics = await calculateMerchantMetrics(merchantId, periodParam as 'LAST_7_DAYS' | 'LAST_30_DAYS')

    const response = {
      merchantId: metrics.merchantId,
      period: metrics.period,
      comparisonPeriod: metrics.period === 'LAST_7_DAYS' ? 'PREVIOUS_7_DAYS' : 'PREVIOUS_30_DAYS',
      revenue: metrics.current.revenue,
      revenueChange: metrics.change.revenueChangePercent,
      cogs: metrics.current.cogs,
      discounts: metrics.current.discount,
      contribution: metrics.current.contribution,
      contributionChange: metrics.change.contributionChangePercent,
      contributionMargin: metrics.current.contributionMarginPercent,
      orders: metrics.current.orders,
      ordersChange: metrics.change.orderChangePercent,
      averageOrderValue: metrics.current.averageOrderValue,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error fetching merchant metrics:', error)
    if (error.message && error.message.includes('not found')) {
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
          message: 'An unexpected error occurred while fetching metrics.',
        },
      },
      { status: 500 }
    )
  }
}
