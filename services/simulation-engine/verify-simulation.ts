import { simulateScenarioFromData } from './index'
import { SimulationRequest } from './types'

function runGoldenPathSimulation() {
  console.log('🔮 EXECUTING PHASE 6 GOLDEN-PATH SIMULATION (Merchant 1 - Brew & Bean Artisan Café)\n')

  const merchant1Product = {
    id: 101,
    merchantId: 1,
    name: 'Artisan Cold Brew Bottle',
    sellingPrice: 200,
    costPrice: 150,
  }

  // Observed historical orders from Phase 2 synthetic dataset for Product 101
  const merchant1Orders = [
    { id: 1, productId: 101, quantity: 26, sellingPrice: 200, discount: 520 },
    { id: 2, productId: 101, quantity: 26, sellingPrice: 200, discount: 520 },
  ]

  const request: SimulationRequest = {
    merchantId: 1,
    productId: 101,
    changeType: 'PRICE',
    newValue: 220, // +10% price test: ₹200 -> ₹220
  }

  const result = simulateScenarioFromData(request, merchant1Product, merchant1Orders)

  console.log('==================================================')
  console.log(`PRODUCT: ${result.productName} (ID: ${result.productId})`)
  console.log(`CHANGE:  ${result.changeType} ₹${result.baseline.price} ➔ ₹${result.newValue}`)
  console.log('==================================================\n')

  console.log('1️⃣ BASELINE OBSERVED VALUES:')
  console.log(`  Price:                 ₹${result.baseline.price}`)
  console.log(`  Orders:                ${result.baseline.orders}`)
  console.log(`  Revenue:               ₹${result.baseline.revenue}`)
  console.log(`  COGS:                  ₹${result.baseline.cogs}`)
  console.log(`  Discount:              ₹${result.baseline.discount}`)
  console.log(`  Contribution:          ₹${result.baseline.contribution}`)
  console.log(`  Contribution Margin %: ${result.baseline.contributionMarginPercent}%\n`)

  console.log('2️⃣ SIMULATED SCENARIO PROJECTION:')
  console.log(`  Price:                 ₹${result.scenario.price}`)
  console.log(`  Projected Orders:      ${result.scenario.projectedOrders}`)
  console.log(`  Projected Revenue:     ₹${result.scenario.projectedRevenue}`)
  console.log(`  Projected COGS:        ₹${result.scenario.projectedCogs}`)
  console.log(`  Projected Discount:    ₹${result.scenario.projectedDiscount}`)
  console.log(`  Projected Contribution:₹${result.scenario.projectedContribution}`)
  console.log(`  Projected Margin %:    ${result.scenario.projectedContributionMarginPercent}%\n`)

  console.log('3️⃣ PROJECTED IMPACT (SCENARIO DELTA):')
  console.log(`  Orders Difference:       ${result.impact.ordersDifference} (${result.impact.ordersDifferencePercent}%)`)
  console.log(`  Revenue Difference:      ₹${result.impact.revenueDifference} (${result.impact.revenueDifferencePercent}%)`)
  console.log(`  Contribution Difference: ₹${result.impact.contributionDifference} (${result.impact.contributionDifferencePercent}%)`)
  console.log(`  Margin Difference:       ${result.impact.contributionMarginDifference}%\n`)

  console.log('4️⃣ MODEL DETAILS:')
  console.log(`  Model Type:  ${result.model.type}`)
  console.log(`  Elasticity:  ${result.model.elasticity}`)
  console.log(`  Description: ${result.model.description}`)
}

runGoldenPathSimulation()
