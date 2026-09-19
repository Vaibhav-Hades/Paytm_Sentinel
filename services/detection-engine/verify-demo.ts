import { calculateMerchantMetrics } from '../economic-engine/index'
import { detectIssues } from './index'

async function runDemoVerification() {
  console.log('🔍 RUNNING DETECTION ENGINE DEMO MERCHANTS VERIFICATION\n')

  const refDate = new Date('2026-09-18T00:00:00Z')

  // MERCHANT 1: Brew & Bean Artisan Café
  console.log('==================================================')
  console.log('MERCHANT 1: Brew & Bean Artisan Café')
  console.log('==================================================')
  const m1Metrics = await calculateMerchantMetrics(1, 'LAST_7_DAYS', refDate)
  const m1Detection = detectIssues(m1Metrics)

  console.log(`Detected Issues Count: ${m1Detection.issues.length}`)
  m1Detection.issues.forEach((issue) => {
    console.log(`  - Issue Type: ${issue.issueType} | Severity: ${issue.severity}`)
    console.log(`    Title: ${issue.title}`)
    console.log(`    Allowed Actions: ${issue.allowedActions.join(', ')}`)
  })

  // MERCHANT 4: Spice Symphony Bistro
  console.log('\n==================================================')
  console.log('MERCHANT 4: Spice Symphony Bistro')
  console.log('==================================================')
  const m4Metrics = await calculateMerchantMetrics(4, 'LAST_7_DAYS', refDate)
  const m4Detection = detectIssues(m4Metrics)

  console.log(`Detected Issues Count: ${m4Detection.issues.length}`)
  m4Detection.issues.forEach((issue) => {
    console.log(`  - Issue Type: ${issue.issueType} | Severity: ${issue.severity}`)
    console.log(`    Title: ${issue.title}`)
    console.log(`    Allowed Actions: ${issue.allowedActions.join(', ')}`)
  })

  // MERCHANT 7: Crust & Crumb Artisan Bakery
  console.log('\n==================================================')
  console.log('MERCHANT 7: Crust & Crumb Artisan Bakery')
  console.log('==================================================')
  const m7Metrics = await calculateMerchantMetrics(7, 'LAST_7_DAYS', refDate)
  const m7Detection = detectIssues(m7Metrics)

  console.log(`Detected Issues Count: ${m7Detection.issues.length}`)
  m7Detection.issues.forEach((issue) => {
    console.log(`  - Issue Type: ${issue.issueType} | Severity: ${issue.severity}`)
    console.log(`    Title: ${issue.title}`)
    console.log(`    Allowed Actions: ${issue.allowedActions.join(', ')}`)
  })
}

runDemoVerification().catch(console.error)
