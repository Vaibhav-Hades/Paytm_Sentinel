import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  try {
    const merchants = await prisma.merchant.findMany({
      select: {
        id: true,
        name: true,
        businessType: true,
        area: true,
        plan: true,
      },
      orderBy: {
        id: 'asc',
      },
    })

    return NextResponse.json({ merchants })
  } catch (error) {
    console.error('Error fetching merchants:', error)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred while fetching merchants.',
        },
      },
      { status: 500 }
    )
  }
}
