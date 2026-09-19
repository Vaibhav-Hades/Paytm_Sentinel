import { calculateMerchantMetrics } from './index'

async function runVerification() {
  console.log('🔍 RUNNING PHASE 3 FINAL VERIFICATION — PERIOD CONSISTENCY\n')

  const refDate = new Date('2026-09-18T00:00:00Z')

  for (const merchantId of [1, 4, 7]) {
    console.log(`==================================================`)
    console.log(`MERCHANT ID: ${merchantId}`)
    console.log(`==================================================`)

    for (const period of ['LAST_7_DAYS', 'LAST_30_DAYS'] as const) {
      const res = await calculateMerchantMetrics(merchantId, period, refDate)
      console.log(`\n--- PERIOD: ${res.period} (${res.merchantName}) ---`)
      console.log(`Current Period Dates:  ${res.currentPeriodDates.startDate.toISOString().substring(0, 10)} to ${res.currentPeriodDates.endDate.toISOString().substring(0, 10)}`)
      console.log(`Previous Period Dates: ${res.previousPeriodDates.startDate.toISOString().substring(0, 10)} to ${res.previousPeriodDates.endDate.toISOString().substring(0, 10)}`)

      console.log('\n[CURRENT PERIOD METRICS]:')
      console.log(`  Revenue:                     ₹${res.current.revenue}`)
      console.log(`  COGS:                        ₹${res.current.cogs}`)
      console.log(`  Discount:                    ₹${res.current.discount}`)
      console.log(`  Contribution:                ₹${res.current.contribution}`)
      console.log(`  Contribution Margin %:       ${res.current.contributionMarginPercent}%`)
      console.log(`  Orders Count:                ${res.current.orders}`)
      console.log(`  Discount-Heavy Orders Count: ${res.current.discountHeavyOrdersCount} (${res.current.discountHeavyOrdersSharePercent}%)`)

      console.log('\n[PREVIOUS PERIOD METRICS]:')
      console.log(`  Revenue:                     ₹${res.previous.revenue}`)
      console.log(`  COGS:                        ₹${res.previous.cogs}`)
      console.log(`  Discount:                    ₹${res.previous.discount}`)
      console.log(`  Contribution:                ₹${res.previous.contribution}`)
      console.log(`  Contribution Margin %:       ${res.previous.contributionMarginPercent}%`)
      console.log(`  Orders Count:                ${res.previous.orders}`)
      console.log(`  Discount-Heavy Orders Count: ${res.previous.discountHeavyOrdersCount} (${res.previous.discountHeavyOrdersSharePercent}%)`)

      console.log('\n[PERIOD COMPARISON / CHANGE]:')
      console.log(`  Revenue Change:              ₹${res.change.revenueDifference} (${res.change.revenueChangePercent}%)`)
      console.log(`  Contribution Change:         ₹${res.change.contributionDifference} (${res.change.contributionChangePercent}%)`)
      console.log(`  Discount Change:             ₹${res.change.discountDifference} (${res.change.discountChangePercent}%)`)
      console.log(`  Orders Change:               ${res.change.ordersDifference} (${res.change.orderChangePercent}%)`)
      console.log(`  Discount-Heavy Orders Change: ${res.change.discountHeavyOrdersDifference} (${res.change.discountHeavyOrdersChangePercent}%)`)
    }
    console.log('\n')
  }
}

runVerification().catch(console.error)
