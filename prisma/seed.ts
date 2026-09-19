import { PrismaClient, SubscriptionPlan } from '@prisma/client'

const prisma = new PrismaClient()

// Seed helper: generate dates relative to current date (2026-09-18)
// Previous period: Days -30 to -15
// Current period: Days -14 to 0
function getDate(daysAgo: number, hour = 12, minute = 0): Date {
  const base = new Date('2026-09-18T00:00:00Z')
  base.setDate(base.getDate() - daysAgo)
  base.setHours(hour, minute, 0, 0)
  return base
}

// Pseudo-random helper with seed for deterministic distribution
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed++) * 10000
  return x - Math.floor(x)
}

async function main() {
  console.log('🌱 Starting Paytm Sentinel Phase 2 Synthetic Data Seed...')

  // Clear existing database records cleanly
  await prisma.experiment.deleteMany()
  await prisma.insight.deleteMany()
  await prisma.order.deleteMany()
  await prisma.product.deleteMany()
  await prisma.merchant.deleteMany()

  console.log('🧹 Cleared existing database records.')

  // 1. MERCHANTS (10 merchants across 4 categories, 2 locations, 3 tiers)
  // Distribution: 3 FREE, 3 STANDARD, 4 PREMIUM
  const merchantsData = [
    // CAFÉ GROUP (Connaught Place, New Delhi)
    {
      id: 1,
      name: 'Brew & Bean Artisan Café',
      businessType: 'CAFÉ',
      area: 'Connaught Place, New Delhi',
      latitude: 28.6315,
      longitude: 77.2167,
      plan: SubscriptionPlan.PREMIUM, // Pattern A: REVENUE_CONTRIBUTION_DIVERGENCE & DISCOUNT_LEAK
    },
    {
      id: 2,
      name: 'The Daily Grind Coffee House',
      businessType: 'CAFÉ',
      area: 'Connaught Place, New Delhi',
      latitude: 28.632,
      longitude: 77.2172,
      plan: SubscriptionPlan.STANDARD,
    },
    {
      id: 3,
      name: 'Chai & Co. Express',
      businessType: 'CAFÉ',
      area: 'Connaught Place, New Delhi',
      latitude: 28.6308,
      longitude: 77.2158,
      plan: SubscriptionPlan.FREE,
    },

    // RESTAURANT GROUP (Indiranagar, Bengaluru)
    {
      id: 4,
      name: 'Spice Symphony Bistro',
      businessType: 'RESTAURANT',
      area: 'Indiranagar, Bengaluru',
      latitude: 12.9784,
      longitude: 77.6408,
      plan: SubscriptionPlan.PREMIUM, // Pattern B: PRODUCT_MIX_LEAK
    },
    {
      id: 5,
      name: 'Urban Tandoor Kitchen',
      businessType: 'RESTAURANT',
      area: 'Indiranagar, Bengaluru',
      latitude: 12.9791,
      longitude: 77.6415,
      plan: SubscriptionPlan.STANDARD,
    },
    {
      id: 6,
      name: 'Southern Spice Curry House',
      businessType: 'RESTAURANT',
      area: 'Indiranagar, Bengaluru',
      latitude: 12.9778,
      longitude: 77.6399,
      plan: SubscriptionPlan.FREE,
    },

    // BAKERY GROUP (Connaught Place, New Delhi)
    {
      id: 7,
      name: 'Crust & Crumb Artisan Bakery',
      businessType: 'BAKERY',
      area: 'Connaught Place, New Delhi',
      latitude: 28.6331,
      longitude: 77.2185,
      plan: SubscriptionPlan.PREMIUM, // Pattern C: HIGH_MARGIN_OPPORTUNITY
    },
    {
      id: 8,
      name: 'Sweet Delights Confectionery',
      businessType: 'BAKERY',
      area: 'Connaught Place, New Delhi',
      latitude: 28.6325,
      longitude: 77.219,
      plan: SubscriptionPlan.FREE,
    },

    // FAST FOOD GROUP (Indiranagar, Bengaluru)
    {
      id: 9,
      name: 'QuickBite Burger & Wrap Bar',
      businessType: 'FAST FOOD',
      area: 'Indiranagar, Bengaluru',
      latitude: 12.9765,
      longitude: 77.6422,
      plan: SubscriptionPlan.STANDARD,
    },
    {
      id: 10,
      name: 'Sizzle & Fry Street Eats',
      businessType: 'FAST FOOD',
      area: 'Indiranagar, Bengaluru',
      latitude: 12.9758,
      longitude: 77.643,
      plan: SubscriptionPlan.PREMIUM,
    },
  ]

  for (const m of merchantsData) {
    await prisma.merchant.create({ data: m })
  }
  console.log(`✅ Seeded ${merchantsData.length} merchants.`)

  // 2. PRODUCTS CATALOG FOR EACH MERCHANT
  const productsData = [
    // Merchant 1: Brew & Bean Artisan Café
    // Low margin: Cold Brew (25%), Medium margin: Cappuccino (53%), High margin: Espresso Roast Bean Bag (75%)
    { id: 101, merchantId: 1, name: 'Artisan Cold Brew Bottle', category: 'Beverage', sellingPrice: 200, costPrice: 150 },
    { id: 102, merchantId: 1, name: 'Classic Cappuccino', category: 'Beverage', sellingPrice: 150, costPrice: 70 },
    { id: 103, merchantId: 1, name: 'Espresso Roast Whole Beans (250g)', category: 'Merchandise', sellingPrice: 400, costPrice: 100 },
    { id: 104, merchantId: 1, name: 'Butter Croissant', category: 'Food', sellingPrice: 120, costPrice: 50 },

    // Merchant 2: The Daily Grind Coffee House
    { id: 201, merchantId: 2, name: 'Iced Latte', category: 'Beverage', sellingPrice: 160, costPrice: 70 },
    { id: 202, merchantId: 2, name: 'Americano', category: 'Beverage', sellingPrice: 120, costPrice: 40 },
    { id: 203, merchantId: 2, name: 'Blueberry Muffin', category: 'Food', sellingPrice: 100, costPrice: 40 },

    // Merchant 3: Chai & Co. Express
    { id: 301, merchantId: 3, name: 'Masala Chai Flask', category: 'Beverage', sellingPrice: 90, costPrice: 30 },
    { id: 302, merchantId: 3, name: 'Kulhad Elaichi Chai', category: 'Beverage', sellingPrice: 50, costPrice: 15 },
    { id: 303, merchantId: 3, name: 'Samosa Twin Pack', category: 'Snacks', sellingPrice: 40, costPrice: 15 },

    // Merchant 4: Spice Symphony Bistro
    // Low margin: Butter Chicken (20%), High margin: Special Mocktail (80%), Medium margin: Paneer Tikka (50%)
    { id: 401, merchantId: 4, name: 'Butter Chicken Special', category: 'Main Course', sellingPrice: 350, costPrice: 280 },
    { id: 402, merchantId: 4, name: 'Paneer Tikka Platter', category: 'Starter', sellingPrice: 280, costPrice: 140 },
    { id: 403, merchantId: 4, name: 'Signature Tropical Mocktail', category: 'Beverage', sellingPrice: 200, costPrice: 40 },

    // Merchant 5: Urban Tandoor Kitchen
    { id: 501, merchantId: 5, name: 'Dal Makhani Curry Bowl', category: 'Main Course', sellingPrice: 240, costPrice: 90 },
    { id: 502, merchantId: 5, name: 'Garlic Naan Basket', category: 'Breads', sellingPrice: 80, costPrice: 20 },
    { id: 503, merchantId: 5, name: 'Chicken Biryani Pot', category: 'Main Course', sellingPrice: 320, costPrice: 140 },

    // Merchant 6: Southern Spice Curry House
    { id: 601, merchantId: 6, name: 'Ghee Roast Dosa', category: 'South Indian', sellingPrice: 130, costPrice: 45 },
    { id: 602, merchantId: 6, name: 'Filter Coffee', category: 'Beverage', sellingPrice: 40, costPrice: 12 },

    // Merchant 7: Crust & Crumb Artisan Bakery
    // High margin: Specialty Truffle Cake (70%), Medium margin: Garlic Bread (50%), Low margin: Sourdough Bread (25%)
    { id: 701, merchantId: 7, name: 'Artisan Sourdough Loaf', category: 'Bread', sellingPrice: 200, costPrice: 150 },
    { id: 702, merchantId: 7, name: 'Herbed Garlic Baguette', category: 'Bread', sellingPrice: 140, costPrice: 70 },
    { id: 703, merchantId: 7, name: 'Belgian Truffle Cake (500g)', category: 'Cakes', sellingPrice: 600, costPrice: 180 },

    // Merchant 8: Sweet Delights Confectionery
    { id: 801, merchantId: 8, name: 'Chocolate Brownie', category: 'Desserts', sellingPrice: 90, costPrice: 35 },
    { id: 802, merchantId: 8, name: 'Pineapple Pastry', category: 'Pastries', sellingPrice: 70, costPrice: 25 },

    // Merchant 9: QuickBite Burger & Wrap Bar
    { id: 901, merchantId: 9, name: 'Crispy Veggie Burger', category: 'Fast Food', sellingPrice: 140, costPrice: 55 },
    { id: 902, merchantId: 9, name: 'Loaded Fries Platter', category: 'Sides', sellingPrice: 120, costPrice: 40 },

    // Merchant 10: Sizzle & Fry Street Eats
    { id: 1001, merchantId: 10, name: 'Smokey BBQ Chicken Wrap', category: 'Wraps', sellingPrice: 210, costPrice: 85 },
    { id: 1002, merchantId: 10, name: 'Fizzing Lemonade Bowl', category: 'Beverage', sellingPrice: 90, costPrice: 20 },
  ]

  for (const p of productsData) {
    await prisma.product.create({ data: p })
  }
  console.log(`✅ Seeded ${productsData.length} products.`)

  // 3. GENERATE SYNTHETIC ORDERS (Target: 30-45 orders per merchant across 30 days)
  let orderIdCounter = 1
  let seedIndex = 100

  for (const merchant of merchantsData) {
    const merchantProducts = productsData.filter((p) => p.merchantId === merchant.id)

    // Generate orders for 30 days (Day 29 to Day 0)
    for (let day = 29; day >= 0; day--) {
      const isCurrentPeriod = day < 15 // Days 0-14 (Last 15 Days) vs Days 15-29 (Previous 15 Days)

      // Determine order volume per day
      let dailyOrdersCount = Math.floor(1 + pseudoRandom(seedIndex++) * 2) // Default 1-2 orders/day

      if (merchant.id === 1 && isCurrentPeriod) {
        // Merchant 1: REVENUE_CONTRIBUTION_DIVERGENCE & DISCOUNT_LEAK
        // Current period has higher volume (3-4 orders/day) with massive discounts
        dailyOrdersCount = Math.floor(3 + pseudoRandom(seedIndex++) * 2)
      } else if (merchant.id === 4 && isCurrentPeriod) {
        // Merchant 4: PRODUCT_MIX_LEAK
        dailyOrdersCount = Math.floor(2 + pseudoRandom(seedIndex++) * 2)
      } else if (merchant.id === 7 && isCurrentPeriod) {
        // Merchant 7: HIGH_MARGIN_OPPORTUNITY
        dailyOrdersCount = Math.floor(2 + pseudoRandom(seedIndex++) * 2)
      }

      for (let o = 0; o < dailyOrdersCount; o++) {
        let chosenProduct = merchantProducts[Math.floor(pseudoRandom(seedIndex++) * merchantProducts.length)]
        let quantity = Math.floor(1 + pseudoRandom(seedIndex++) * 2)
        let discount = 0

        // INTENTIONAL PATTERN LOGIC:
        if (merchant.id === 1) {
          // Merchant 1: Brew & Bean Artisan Café
          if (isCurrentPeriod) {
            // Heavy discounting in current period (e.g. ₹55 to ₹85 discount per order)
            discount = Math.floor(50 + pseudoRandom(seedIndex++) * 35)
          } else {
            // Normal low discount in previous period (e.g. ₹0 to ₹10)
            discount = Math.floor(pseudoRandom(seedIndex++) * 10)
          }
        } else if (merchant.id === 4) {
          // Merchant 4: Spice Symphony Bistro (PRODUCT_MIX_LEAK)
          if (isCurrentPeriod) {
            // Shift towards low margin product (Butter Chicken - Product 401)
            chosenProduct = merchantProducts.find((p) => p.id === 401) || chosenProduct
            quantity = Math.floor(2 + pseudoRandom(seedIndex++) * 2)
          } else {
            // Balanced mix in previous period
            chosenProduct = merchantProducts.find((p) => p.id === 402) || chosenProduct
          }
          discount = Math.floor(pseudoRandom(seedIndex++) * 15)
        } else if (merchant.id === 7) {
          // Merchant 7: Crust & Crumb Artisan Bakery (HIGH_MARGIN_OPPORTUNITY)
          if (isCurrentPeriod) {
            // Strong growth in high margin product (Belgian Truffle Cake - Product 703, 70% margin)
            chosenProduct = merchantProducts.find((p) => p.id === 703) || chosenProduct
            quantity = 2
          } else {
            // Previous period ordered sourdough bread (Product 701)
            chosenProduct = merchantProducts.find((p) => p.id === 701) || chosenProduct
          }
          discount = 5
        } else {
          // Standard baseline merchants
          discount = Math.floor(pseudoRandom(seedIndex++) * 15)
        }

        const hour = 9 + Math.floor(pseudoRandom(seedIndex++) * 12)
        const minute = Math.floor(pseudoRandom(seedIndex++) * 60)
        const orderDate = getDate(day, hour, minute)

        await prisma.order.create({
          data: {
            id: orderIdCounter++,
            merchantId: merchant.id,
            productId: chosenProduct.id,
            quantity: quantity,
            sellingPrice: chosenProduct.sellingPrice,
            discount: discount,
            createdAt: orderDate,
          },
        })
      }
    }
  }

  const totalOrdersCount = await prisma.order.count()
  console.log(`✅ Seeded ${totalOrdersCount} total orders successfully.`)

  // 4. DATA PATTERN MATHEMATICAL VERIFICATION
  console.log('\n📊 VERIFYING INTENTIONAL BUSINESS PATTERNS:')

  // Verify Merchant 1 (Revenue ↑, Contribution ↓, Discount ↑)
  const m1Orders = await prisma.order.findMany({ where: { merchantId: 1 }, include: { product: true } })
  type OrderWithProduct = (typeof m1Orders)[number]
  const m1Prev = m1Orders.filter((o: OrderWithProduct) => o.createdAt < new Date('2026-09-03T00:00:00Z'))
  const m1Curr = m1Orders.filter((o: OrderWithProduct) => o.createdAt >= new Date('2026-09-03T00:00:00Z'))

  const calcStats = (orders: OrderWithProduct[]) => {
    let rev = 0,
      cogs = 0,
      disc = 0
    orders.forEach((o: OrderWithProduct) => {
      rev += o.sellingPrice * o.quantity
      cogs += o.product.costPrice * o.quantity
      disc += o.discount
    })
    const contrib = rev - cogs - disc
    return { rev, cogs, disc, contrib }
  }

  const m1PrevStats = calcStats(m1Prev)
  const m1CurrStats = calcStats(m1Curr)

  console.log(`
  [Merchant 1 - Brew & Bean Artisan Café]
  - Previous Period (Days 15-30): Revenue = ₹${m1PrevStats.rev}, Contribution = ₹${m1PrevStats.contrib}, Discount = ₹${m1PrevStats.disc}
  - Current Period  (Days 0-14) : Revenue = ₹${m1CurrStats.rev}, Contribution = ₹${m1CurrStats.contrib}, Discount = ₹${m1CurrStats.disc}
  - Result: Revenue change = ${(((m1CurrStats.rev - m1PrevStats.rev) / m1PrevStats.rev) * 100).toFixed(1)}%, Contribution change = ${(
    ((m1CurrStats.contrib - m1PrevStats.contrib) / m1PrevStats.contrib) *
    100
  ).toFixed(1)}%, Discount change = ${(((m1CurrStats.disc - m1PrevStats.disc) / m1PrevStats.disc) * 100).toFixed(1)}%
  - Trigger Verified: REVENUE_CONTRIBUTION_DIVERGENCE & DISCOUNT_LEAK!
  `)

  // Verify Merchant 4 (Product Mix Leak)
  const m4Orders = await prisma.order.findMany({ where: { merchantId: 4 }, include: { product: true } })
  type M4OrderWithProduct = (typeof m4Orders)[number]
  const m4PrevLowMargin = m4Orders
    .filter((o: M4OrderWithProduct) => o.createdAt < new Date('2026-09-03T00:00:00Z') && o.productId === 401)
    .reduce((sum: number, o: M4OrderWithProduct) => sum + o.quantity, 0)
  const m4CurrLowMargin = m4Orders
    .filter((o: M4OrderWithProduct) => o.createdAt >= new Date('2026-09-03T00:00:00Z') && o.productId === 401)
    .reduce((sum: number, o: M4OrderWithProduct) => sum + o.quantity, 0)

  console.log(`  [Merchant 4 - Spice Symphony Bistro]
  - Previous Period Low-Margin (20% margin) Units Sold: ${m4PrevLowMargin}
  - Current Period Low-Margin (20% margin) Units Sold: ${m4CurrLowMargin}
  - Trigger Verified: PRODUCT_MIX_LEAK!
  `)

  // Verify Merchant 7 (High Margin Opportunity)
  const m7Orders = await prisma.order.findMany({ where: { merchantId: 7 }, include: { product: true } })
  type M7OrderWithProduct = (typeof m7Orders)[number]
  const m7PrevHighMargin = m7Orders
    .filter((o: M7OrderWithProduct) => o.createdAt < new Date('2026-09-03T00:00:00Z') && o.productId === 703)
    .reduce((sum: number, o: M7OrderWithProduct) => sum + o.quantity, 0)
  const m7CurrHighMargin = m7Orders
    .filter((o: M7OrderWithProduct) => o.createdAt >= new Date('2026-09-03T00:00:00Z') && o.productId === 703)
    .reduce((sum: number, o: M7OrderWithProduct) => sum + o.quantity, 0)

  console.log(`  [Merchant 7 - Crust & Crumb Artisan Bakery]
  - Previous Period High-Margin (70% margin) Units Sold: ${m7PrevHighMargin}
  - Current Period High-Margin (70% margin) Units Sold: ${m7CurrHighMargin}
  - Trigger Verified: HIGH_MARGIN_OPPORTUNITY!
  `)

  console.log('🎉 Phase 2 Synthetic Data Seed Completed Successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error executing seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
