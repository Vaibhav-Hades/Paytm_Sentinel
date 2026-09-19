import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { calculateGrossMargin } from '../../../services/economic-engine/formulas'

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

    const products = await prisma.product.findMany({
      where: { merchantId },
      orderBy: { id: 'asc' },
    })

    const mappedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      sellingPrice: product.sellingPrice,
      costPrice: product.costPrice,
      marginPercent: calculateGrossMargin(product.sellingPrice, product.costPrice),
    }))

    return NextResponse.json({ products: mappedProducts })
  } catch (error: any) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred while fetching products.',
        },
      },
      { status: 500 }
    )
  }
}
