import { prisma } from '../lib/prisma'

async function main() {
  const insight = await prisma.insight.create({
    data: {
      merchantId: 1,
      issueType: 'DISCOUNT_LEAK',
      severity: 'HIGH',
      title: 'Discount Leak Detected',
      description: 'Heavy discounting is eroding contribution margin.',
      signals: { discountChangePercent: 3285 },
      aiOutput: {}
    }
  })
  console.log('Created insight id:', insight.id)
  await prisma.$disconnect()
}

main()
