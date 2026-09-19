const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('=== PHASE 8 RUNTIME VERIFICATION SCRIPT ===\n');

  // STEP 3: API SMOKE TEST
  console.log('--- STEP 3: API SMOKE TEST ---');

  // GET /api/merchants
  const resMerchants = await fetch(`${BASE_URL}/api/merchants`);
  const dataMerchants: any = await resMerchants.json();
  console.log('GET /api/merchants:', resMerchants.status, Array.isArray(dataMerchants.merchants) ? `${dataMerchants.merchants.length} merchants` : dataMerchants);

  // GET /api/merchant/metrics?merchantId=1
  const resMetrics1 = await fetch(`${BASE_URL}/api/merchant/metrics?merchantId=1`);
  const dataMetrics1: any = await resMetrics1.json();
  console.log('GET /api/merchant/metrics?merchantId=1:', resMetrics1.status, Object.keys(dataMetrics1));

  // GET /api/products?merchantId=1
  const resProducts1 = await fetch(`${BASE_URL}/api/products?merchantId=1`);
  const dataProducts1: any = await resProducts1.json();
  console.log('GET /api/products?merchantId=1:', resProducts1.status, Array.isArray(dataProducts1.products) ? `${dataProducts1.products.length} products` : dataProducts1);

  // GET /api/insights?merchantId=1
  const resInsights1 = await fetch(`${BASE_URL}/api/insights?merchantId=1`);
  const dataInsights1: any = await resInsights1.json();
  console.log('GET /api/insights?merchantId=1:', resInsights1.status, Array.isArray(dataInsights1.insights) ? `${dataInsights1.insights.length} insights` : dataInsights1);

  let insightId = 1;
  if (Array.isArray(dataInsights1.insights) && dataInsights1.insights.length > 0) {
    insightId = dataInsights1.insights[0].id;
  }

  // GET /api/insights/:id?merchantId=1
  const resInsightDetail = await fetch(`${BASE_URL}/api/insights/${insightId}?merchantId=1`);
  const dataInsightDetail: any = await resInsightDetail.json();
  console.log(`GET /api/insights/${insightId}?merchantId=1:`, resInsightDetail.status, dataInsightDetail.id ? `Insight #${dataInsightDetail.id}` : dataInsightDetail);

  // POST /api/simulation
  const firstProductId = Array.isArray(dataProducts1.products) && dataProducts1.products.length > 0 ? dataProducts1.products[0].id : 101;
  const resSim = await fetch(`${BASE_URL}/api/simulation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      merchantId: 1,
      productId: firstProductId,
      changeType: 'PRICE',
      newValue: 220
    })
  });
  const dataSim: any = await resSim.json();
  console.log('POST /api/simulation (PRICE):', resSim.status, dataSim.baselineContribution !== undefined ? 'Simulation calculated' : dataSim);

  // POST /api/experiments
  const resExpCreate = await fetch(`${BASE_URL}/api/experiments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      merchantId: 1,
      name: 'Verification Price Test',
      type: 'PRICE_CHANGE',
      productId: firstProductId,
      insightId: insightId,
      oldValue: 200,
      newValue: 220,
      targetDurationDays: 14
    })
  });
  const dataExpCreate: any = await resExpCreate.json();
  console.log('POST /api/experiments:', resExpCreate.status, dataExpCreate.id ? `Created Exp #${dataExpCreate.id} (${dataExpCreate.status})` : dataExpCreate);

  let createdExpId = dataExpCreate.id;

  if (createdExpId) {
    // GET /api/experiments/:id
    const resExpGet = await fetch(`${BASE_URL}/api/experiments/${createdExpId}?merchantId=1`);
    const dataExpGet: any = await resExpGet.json();
    console.log(`GET /api/experiments/${createdExpId}:`, resExpGet.status, dataExpGet.id ? `Exp #${dataExpGet.id}` : dataExpGet);

    // POST /api/experiments/:id/approve
    const resExpApprove = await fetch(`${BASE_URL}/api/experiments/${createdExpId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantId: 1 })
    });
    const dataExpApprove: any = await resExpApprove.json();
    console.log(`POST /api/experiments/${createdExpId}/approve:`, resExpApprove.status, dataExpApprove.status ? `Status: ${dataExpApprove.status}` : dataExpApprove);

    // GET /api/experiments/:id/result
    const resExpResult = await fetch(`${BASE_URL}/api/experiments/${createdExpId}/result?merchantId=1`);
    const dataExpResult: any = await resExpResult.json();
    console.log(`GET /api/experiments/${createdExpId}/result:`, resExpResult.status, dataExpResult.status ? `Status: ${dataExpResult.status}` : dataExpResult);
  }

  // POST /api/webhooks/n8n
  const resN8n = await fetch(`${BASE_URL}/api/webhooks/n8n`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventType: 'PING', timestamp: new Date().toISOString() })
  });
  const dataN8n: any = await resN8n.json();
  console.log('POST /api/webhooks/n8n:', resN8n.status, dataN8n);

  console.log('\n--- STEP 4: MULTI-MERCHANT ISOLATION ---');
  // Compare Merchant 1 (CAFÉ) vs Merchant 4 (RESTAURANT)
  const resM1Products = await fetch(`${BASE_URL}/api/products?merchantId=1`);
  const dataM1Products: any = await resM1Products.json();
  const resM4Products = await fetch(`${BASE_URL}/api/products?merchantId=4`);
  const dataM4Products: any = await resM4Products.json();

  const m1ProductIds = (dataM1Products.products || []).map((p: any) => p.id);
  const m4ProductIds = (dataM4Products.products || []).map((p: any) => p.id);
  const overlapProducts = m1ProductIds.filter((id: number) => m4ProductIds.includes(id));
  console.log(`Merchant 1 Products (${m1ProductIds.length}), Merchant 4 Products (${m4ProductIds.length}), Overlap: ${overlapProducts.length}`);

  const resM1Metrics = await fetch(`${BASE_URL}/api/merchant/metrics?merchantId=1`);
  const dataM1Metrics: any = await resM1Metrics.json();
  const resM4Metrics = await fetch(`${BASE_URL}/api/merchant/metrics?merchantId=4`);
  const dataM4Metrics: any = await resM4Metrics.json();
  console.log(`Merchant 1 Revenue: ₹${dataM1Metrics.currentPeriod?.totalRevenue}, Merchant 4 Revenue: ₹${dataM4Metrics.currentPeriod?.totalRevenue}`);

  const resM1Insights = await fetch(`${BASE_URL}/api/insights?merchantId=1`);
  const dataM1Insights: any = await resM1Insights.json();
  const resM4Insights = await fetch(`${BASE_URL}/api/insights?merchantId=4`);
  const dataM4Insights: any = await resM4Insights.json();
  console.log(`Merchant 1 Insights (${(dataM1Insights.insights || []).length}), Merchant 4 Insights (${(dataM4Insights.insights || []).length})`);

  console.log('\n--- STEP 5: SUBSCRIPTION TIER TEST ---');
  // Merchant 3 (FREE), Merchant 2 (STANDARD), Merchant 1 (PREMIUM)
  const resM3Metrics = await fetch(`${BASE_URL}/api/merchant/metrics?merchantId=3`);
  const dataM3Metrics: any = await resM3Metrics.json();
  console.log('FREE Merchant 3 Metrics Status:', resM3Metrics.status, 'Has basic metrics:', !!dataM3Metrics.currentPeriod);

  const resM3Insights = await fetch(`${BASE_URL}/api/insights?merchantId=3`);
  const dataM3Insights: any = await resM3Insights.json();
  console.log('FREE Merchant 3 Insights Status:', resM3Insights.status, dataM3Insights);

  const resM3Sim = await fetch(`${BASE_URL}/api/simulation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchantId: 3, productId: dataM1Products.products[0]?.id || 1, changeType: 'PRICE', newValue: 100 })
  });
  console.log('FREE Merchant 3 Simulation Status:', resM3Sim.status, await resM3Sim.json());

  const resM2Insights = await fetch(`${BASE_URL}/api/insights?merchantId=2`);
  const dataM2Insights: any = await resM2Insights.json();
  console.log('STANDARD Merchant 2 Insights Status:', resM2Insights.status, `Insights count: ${(dataM2Insights.insights || []).length}`);

  const resM1Peer = await fetch(`${BASE_URL}/api/merchant/metrics?merchantId=1`);
  const dataM1Peer: any = await resM1Peer.json();
  console.log('PREMIUM Merchant 1 Metrics Has Peer Benchmark:', !!dataM1Peer.peerBenchmark);

  console.log('\n--- STEP 7: SIMULATION DETAILED TEST ---');
  const resSimPrice = await fetch(`${BASE_URL}/api/simulation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      merchantId: 1,
      productId: m1ProductIds[0],
      changeType: 'PRICE',
      newValue: 220
    })
  });
  console.log('PRICE Simulation Result:', resSimPrice.status, await resSimPrice.json());

  const resSimDiscount = await fetch(`${BASE_URL}/api/simulation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      merchantId: 1,
      productId: m1ProductIds[0],
      changeType: 'DISCOUNT',
      newValue: 5
    })
  });
  console.log('DISCOUNT Simulation Result:', resSimDiscount.status, await resSimDiscount.json());

  console.log('\n--- STEP 8: EXPERIMENT LIFECYCLE COMPLETE WALKTHROUGH ---');
  // Create experiment
  const expRes1 = await fetch(`${BASE_URL}/api/experiments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      merchantId: 1,
      name: 'Lifecycle Test Exp',
      type: 'PRICE_CHANGE',
      productId: m1ProductIds[0],
      insightId: 2,
      oldValue: 200,
      newValue: 250,
      targetDurationDays: 7
    })
  });
  const expData1: any = await expRes1.json();
  console.log('1. Created Exp:', expData1.status, expData1.id);

  // Attempt result while in DRAFT (should fail or return current projection if implemented)
  const expResInvalidResult = await fetch(`${BASE_URL}/api/experiments/${expData1.id}/result?merchantId=1`);
  console.log('2. Result before Approval:', expResInvalidResult.status, await expResInvalidResult.json());

  // Approve experiment
  const expResApprove = await fetch(`${BASE_URL}/api/experiments/${expData1.id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchantId: 1 })
  });
  const expDataApprove: any = await expResApprove.json();
  console.log('3. Approved Exp:', expResApprove.status, expDataApprove.status);

  // Complete experiment result (API Spec: GET /api/experiments/:id/result)
  const expResResult = await fetch(`${BASE_URL}/api/experiments/${expData1.id}/result?merchantId=1`);
  const expDataResult: any = await expResResult.json();
  console.log('4. Get Result Exp:', expResResult.status, expDataResult.status, expDataResult.result);

  // Check Cancellation if implemented
  const expResCancelTest = await fetch(`${BASE_URL}/api/experiments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      merchantId: 1,
      name: 'Cancellation Test Exp',
      type: 'PRICE_CHANGE',
      productId: m1ProductIds[0],
      insightId: 2,
      oldValue: 200,
      newValue: 260,
      targetDurationDays: 7
    })
  });
  const expCancelData: any = await expResCancelTest.json();
  console.log('5. Created Exp for Cancellation:', expCancelData.id);

  // Try DELETE/Cancel Exp
  const resCancel = await fetch(`${BASE_URL}/api/experiments/${expCancelData.id}?merchantId=1`, {
    method: 'DELETE'
  });
  console.log('6. DELETE/Cancel Exp:', resCancel.status, await resCancel.text());

  console.log('\n--- STEP 9: n8n WEBHOOK DETAILED TEST ---');
  // Valid request without secret (if secret not set)
  const resWebhookNoAuth = await fetch(`${BASE_URL}/api/webhooks/n8n`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventType: 'SUMMARY_TRIGGER', merchantId: 1 })
  });
  console.log('n8n Webhook Response:', resWebhookNoAuth.status, await resWebhookNoAuth.json());
}

runTests().catch(console.error);
