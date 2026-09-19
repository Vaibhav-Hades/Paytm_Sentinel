# PAYTM SENTINEL — SYSTEM ARCHITECTURE

## 1. PRODUCT

Product Name:
Paytm Sentinel

Team:
Syntax Squad

Team Members:
- YMS Vaibhav — Core Intelligence, Backend & System Architecture
- Adithya — Frontend & n8n Workflow Automation

Track:
Merchant Growth AI

---

## 2. PRODUCT OBJECTIVE

Paytm Sentinel is an AI-powered merchant economic copilot.

The purpose of Sentinel is to help a merchant:

1. Detect contribution/profit leaks.
2. Diagnose why the leak is happening.
3. Simulate possible business decisions.
4. Allow the merchant to approve a decision.
5. Run a controlled experiment.
6. Measure the result.
7. Learn from the outcome.

Core loop:

DETECT → DIAGNOSE → SIMULATE → EXPERIMENT → MEASURE → LEARN

Sentinel is NOT intended to be only:
- a dashboard
- a chatbot
- a generic analytics application

The core value is connecting merchant economic signals to a measurable business decision.

---

# 3. MVP SCOPE

The working prototype supports **multiple synthetic merchants** (10 demo merchants) with three intelligence subscription tiers (**FREE**, **STANDARD**, **PREMIUM**).

Example demo merchant:

Brew & Bean Artisan Café (Merchant ID 1, PREMIUM tier)

Example problem:

Revenue is increasing while contribution is decreasing.

Example recommendation:

Test a moderate price increase for a selected product.

Example experiment:

₹299 → ₹319 for 7 days.

The MVP does NOT require:
- real Paytm APIs
- real Paytm merchant data
- authentication or user registration
- subscription billing infrastructure
- complex machine learning
- multilingual support
- voice support
- real payment processing
- production-grade experimentation statistics

Synthetic data is used for the prototype across 10 distinct merchants spanning multiple business categories (Café, Restaurant, Bakery, Fast Food) and locations (Connaught Place, Indiranagar).

The architecture allows the synthetic data layer to be replaced by permissioned real merchant data in the future.

---

# 3.1. SUBSCRIPTION TIERS & FEATURE GATING

Paytm Sentinel features three intelligence tiers. The subscription tier changes the **DEPTH OF INTELLIGENCE** provided to the merchant. It does **NOT** alter underlying financial data or calculations.

The Economic Engine calculates deterministic financial truth identically regardless of subscription tier. Feature access is authoritatively gated by the backend based on `Merchant.plan`.

### Subscription Tiers:

1. **FREE (SEE)**:
   - Basic business metrics & dashboards
   - Historical performance analysis
   - Focus: *"What happened?"*

2. **STANDARD (DECIDE)**:
   - Everything in FREE
   - Profit leak detection
   - AI diagnosis & driver identification
   - Actionable recommendations
   - Deterministic decision simulation
   - Experiment lifecycle & measurement
   - Outcome learning & insight persistence
   - Focus: *"Why did it happen & what should I test?"*

3. **PREMIUM (GROW)**:
   - Everything in STANDARD
   - Peer comparison & anonymized benchmarking
   - Aggregated peer performance insights
   - Historical cross-merchant AI learning
   - Cognee context integration
   - Personalized growth roadmap
   - Focus: *"What are comparable merchants doing & how do I grow?"*

### Backend Feature Matrix (Authoritative Gating):

| Feature Flag | FREE | STANDARD | PREMIUM |
| :--- | :---: | :---: | :---: |
| `basic_metrics` | ✅ | ✅ | ✅ |
| `historical_analysis` | ✅ | ✅ | ✅ |
| `detection` | ❌ | ✅ | ✅ |
| `ai_diagnosis` | ❌ | ✅ | ✅ |
| `recommendations` | ❌ | ✅ | ✅ |
| `simulation` | ❌ | ✅ | ✅ |
| `experiments` | ❌ | ✅ | ✅ |
| `measurement` | ❌ | ✅ | ✅ |
| `learning` | ❌ | ✅ | ✅ |
| `peer_intelligence` | ❌ | ❌ | ✅ |
| `peer_benchmarking` | ❌ | ❌ | ✅ |
| `historical_ai_learning` | ❌ | ❌ | ✅ |
| `cognee_context` | ❌ | ❌ | ✅ |
| `personalized_growth_plan` | ❌ | ❌ | ✅ |

The backend enforces this feature matrix on all requests. Frontend visual gating is presentation-only.

---

# 4. ARCHITECTURE PRINCIPLE

The system must separate:

A. Deterministic business calculations
B. Detection rules
C. AI reasoning
D. Simulation
E. Workflow automation

The LLM MUST NOT be responsible for financial calculations.

The LLM MUST NOT invent financial values.

Financial calculations must originate from deterministic backend services.

---

# 5. HIGH-LEVEL ARCHITECTURE

Merchant
    |
    v
Frontend
    |
    v
Sentinel API
    |
    +--------------------+
    |                    |
    v                    v
Economic Engine     Detection Engine
    |                    |
    +---------+----------+
              |
              v
        AI Reasoning Engine
              |
              v
          Validation
              |
              v
       Recommendation
              |
              v
       Merchant Approval
              |
              v
       Experiment Engine
              |
              v
             n8n
              |
              v
       Measure Experiment
              |
              v
          Learn/Store
              |
              v
       Future Detection

Simulation Engine is accessed when the merchant wants to test a proposed decision.

---

# 6. TECHNOLOGY STACK

Frontend:
- Next.js
- TypeScript
- Tailwind CSS

Backend:
- Next.js API / Node.js

Database:
- PostgreSQL
- Prisma ORM

Validation:
- Zod

AI:
- One LLM API provider

Automation:
- n8n

Version Control:
- Git
- GitHub

Development:
- Antigravity / Cursor

Deployment:
- Frontend/backend can be deployed using a suitable cloud platform.
- Database can use hosted PostgreSQL.

Do not introduce additional technologies unless required.

---

# 7. DATABASE

The MVP should use the minimum required schema.

## Merchant

Fields:

- id
- name
- businessType
- area
- latitude
- longitude
- plan (FREE | STANDARD | PREMIUM)
- createdAt

Example:

id: 1
name: Brew & Bean Artisan Café
businessType: CAFÉ
area: Connaught Place, New Delhi
latitude: 28.6315
longitude: 77.2167
plan: PREMIUM

Location fields (`area`, `latitude`, `longitude`) exist solely to support deterministic lightweight peer comparison among comparable merchant clusters without complex geospatial infrastructure.

---

## Product

Fields:

- id
- merchantId
- name
- category
- sellingPrice
- costPrice
- createdAt

---

## Order

Fields:

- id
- merchantId
- productId
- quantity
- sellingPrice
- discount
- createdAt

---

## Experiment

Fields:

- id
- merchantId
- productId
- type
- oldValue
- newValue
- durationDays
- metric
- status
- startedAt
- completedAt

Possible status values:

- DRAFT
- RUNNING
- COMPLETED
- CANCELLED

Possible metric:

- CONTRIBUTION
- CONTRIBUTION_MARGIN
- REVENUE
- ORDERS

---

## Insight

Fields:

- id
- merchantId
- issueType
- severity
- title
- description
- signals (JSON)
- aiOutput (JSON)
- createdAt

The signals field stores the economic signals that triggered detection.

The aiOutput field stores the validated AI output verbatim.

---

# 8. ECONOMIC ENGINE

The Economic Engine is deterministic.

It MUST NOT use an LLM.

## Revenue

Revenue is:

SUM(sellingPrice × quantity)

---

## COGS

COGS is:

SUM(costPrice × quantity)

---

## Discount

Discount is:

SUM(discount)

---

## Contribution

Contribution is:

Revenue - COGS - Discount

---

## Contribution Margin

Contribution Margin is:

Contribution / Revenue × 100

If Revenue is zero, contribution margin must safely return zero or an explicitly defined null value.

---

## Product Margin

Product margin percentage per product is:

(sellingPrice - costPrice) / sellingPrice × 100

This is gross margin percentage.

Do not use markup percentage.

---

# 9. ECONOMIC ENGINE OUTPUT

The Economic Engine should produce structured metrics.

Example:

{
  "revenue": 251400,
  "cogs": 142000,
  "discounts": 21500,
  "contribution": 87900,
  "contributionMargin": 34.97,
  "orders": 840
}

It should also support comparison between two periods.

Example:

{
  "revenueChange": 8.2,
  "contributionChange": -4.1,
  "discountOrderChange": 22.4
}

All percentage calculations must be deterministic.

---

# 10. DETECTION ENGINE

The Detection Engine is rule-based.

The MVP should implement the following signals.

## Rule 1 — Revenue/Contribution Divergence

IF:

revenueChange > 0

AND:

contributionChange < 0

THEN:

issueType = REVENUE_CONTRIBUTION_DIVERGENCE

---

## Rule 2 — Discount Leak

IF:

discount-heavy orders increase

AND:

contribution per order decreases

THEN:

issueType = DISCOUNT_LEAK

---

## Rule 3 — Low Margin Product Mix

IF:

share of low-margin product orders increases

THEN:

issueType = PRODUCT_MIX_LEAK

---

## Rule 4 — High Margin Opportunity

IF:

high-margin product demand increases

THEN:

issueType = HIGH_MARGIN_OPPORTUNITY

---

# 11. DETECTION OUTPUT

Example:

{
  "issueType": "DISCOUNT_LEAK",
  "severity": "HIGH",
  "title": "Profit leak detected",
  "signals": {
    "revenueChange": 8.2,
    "contributionChange": -4.1,
    "discountOrderChange": 22.4,
    "lowMarginOrderChange": 18.3
  }
}

The Detection Engine must provide facts/signals to the AI.

---

# 11.1. ALLOWED ACTIONS MAPPING

The backend owns the issueType → allowedActions mapping.

The AI MUST NOT generate the allowedActions list.

REVENUE_CONTRIBUTION_DIVERGENCE:

- REDUCE_DISCOUNT
- INCREASE_PRICE
- PROMOTE_HIGH_MARGIN_BUNDLE

DISCOUNT_LEAK:

- REDUCE_DISCOUNT
- INCREASE_PRICE
- PROMOTE_HIGH_MARGIN_BUNDLE

PRODUCT_MIX_LEAK:

- PROMOTE_HIGH_MARGIN_BUNDLE
- REDUCE_LOW_MARGIN_PROMOTION

HIGH_MARGIN_OPPORTUNITY:

- PROMOTE_HIGH_MARGIN_BUNDLE
- INCREASE_HIGH_MARGIN_PRODUCT_VISIBILITY

---

# 12. AI REASONING ENGINE

The AI is responsible for reasoning and communication.

The AI MAY:

- explain detected problems
- identify probable drivers from supplied signals
- recommend available actions
- explain simulation results
- interpret experiment results
- communicate uncertainty
- answer merchant questions using available backend tools

The AI MUST NOT:

- calculate financial metrics
- invent numbers
- invent transactions
- invent products
- directly modify financial records
- directly change merchant prices
- execute consequential actions without merchant approval

---

# 13. AI INPUT

The AI should receive structured information.

Example:

{
  "merchant": {
    "name": "Rajesh's Cafe",
    "businessType": "CAFE"
  },
  "issue": {
    "type": "DISCOUNT_LEAK",
    "severity": "HIGH"
  },
  "economicSignals": {
    "revenueChange": 8.2,
    "contributionChange": -4.1,
    "discountOrderChange": 22.4,
    "lowMarginOrderChange": 18.3
  },
  "allowedActions": [
    "REDUCE_DISCOUNT",
    "INCREASE_PRICE",
    "PROMOTE_HIGH_MARGIN_BUNDLE"
  ]
}

---

# 14. AI OUTPUT

The AI MUST return structured output.

Required fields:

{
  "problem": "...",
  "evidence": [],
  "probableDriver": "...",
  "confidence": 0.0,
  "recommendations": [
    {
      "action": "...",
      "reason": "...",
      "simulationRequired": true
    }
  ]
}

The response must conform to the backend validation schema.

Invalid AI output must not be passed directly to the frontend.

---

# 15. AI SYSTEM PROMPT PRINCIPLES

The AI system prompt must enforce:

1. Use only supplied facts.
2. Never invent financial numbers.
3. Never perform authoritative financial calculations.
4. Never claim access to real Paytm data.
5. Never execute consequential merchant actions automatically.
6. Recommend only allowed actions.
7. Clearly distinguish observed facts from inferred causes.
8. Express uncertainty when evidence is insufficient.
9. Return the required structured JSON.
10. Keep merchant explanations concise and understandable.

---

# 16. AI TOOLS

The architecture may expose controlled tools to the AI.

Allowed read tools:

- getMerchantMetrics()
- getProductMargins()
- getDetectedIssues()

Allowed simulation tools:

- simulatePriceChange()
- simulateDiscountChange()

Allowed action tool:

- createExperiment()

The AI must NOT receive unrestricted database access.

The AI must NOT receive arbitrary code execution.

Consequential actions require merchant approval.

---

# 17. SIMULATION ENGINE

The Simulation Engine is deterministic.

It must NOT use the LLM to calculate results.

Input — Price Simulation:

{
  "productId": 101,
  "changeType": "PRICE",
  "newValue": 319
}

Input — Discount Simulation:

{
  "productId": 101,
  "changeType": "DISCOUNT",
  "newValue": 10
}

The backend selects the deterministic simulation model based on changeType.

The simulation engine should use:

- current price
- proposed price
- current order volume
- product cost
- discount
- configurable demand response / price elasticity

It should calculate:

- projected orders
- projected revenue
- projected contribution
- difference in contribution
- percentage difference

Example output:

{
  "current": {
    "price": 299,
    "orders": 840,
    "contribution": 67200
  },
  "scenario": {
    "price": 319,
    "orders": 805,
    "contribution": 80500
  },
  "difference": 13300,
  "differencePercent": 19.79
}

These numbers are prototype/synthetic values.

---

# 18. EXPERIMENT ENGINE

The Experiment Engine manages merchant-approved tests.

Example:

PRICE_TEST

Old price:
₹299

New price:
₹319

Duration:
7 days

Primary metric:
CONTRIBUTION

Experiment lifecycle:

DRAFT
  ↓
RUNNING
  ↓
COMPLETED

The merchant must explicitly approve the experiment.

---

# 19. EXPERIMENT RESULT

The backend must calculate the actual experiment result.

## Canonical Internal ExperimentResultDTO

The canonical internal DTO passed between backend services and supplied to the AI is:

{
  "baselineContribution": number,
  "experimentContribution": number,
  "baselineOrders": number,
  "experimentOrders": number,
  "contributionDifference": number,
  "contributionChangePercent": number,
  "orderDifference": number,
  "orderChangePercent": number
}

Example:

{
  "baselineContribution": 67200,
  "experimentContribution": 78900,
  "baselineOrders": 840,
  "experimentOrders": 812,
  "contributionDifference": 11700,
  "contributionChangePercent": 17.41,
  "orderDifference": -28,
  "orderChangePercent": -3.33
}

## Public REST API Response

The public REST endpoint (GET /api/experiments/:id/result) uses a different nested baseline/result/impact structure for frontend readability. See API_CONTRACT.md §10.

## AI Input

The AI receives the canonical internal ExperimentResultDTO, NOT the public REST response shape.

The AI may then interpret the result:

"This test increased contribution while order volume declined moderately."

The numerical result itself must come from deterministic backend calculations.

---

# 20. N8N RESPONSIBILITY

n8n is the workflow/orchestration layer.

n8n MUST NOT become the location of core financial business logic.

Adithya owns n8n implementation.

Primary workflow:

Merchant/Event
    ↓
n8n Webhook
    ↓
Sentinel API
    ↓
Economic Analysis
    ↓
Detection
    ↓
AI Recommendation
    ↓
Store Insight
    ↓
Notify Frontend

Experiment workflow:

Experiment Started
    ↓
n8n
    ↓
Collect Metrics
    ↓
Compare Baseline
    ↓
Update Experiment
    ↓
Experiment Completed
    ↓
Generate Outcome
    ↓
Store Learning

---

# 21. API CONTRACT

The backend should initially expose:

GET /api/merchant/metrics

GET /api/products

GET /api/insights

POST /api/simulation

POST /api/experiments

GET /api/experiments/:id

GET /api/experiments/:id/result

Additional APIs may be added only when required.

---

# 22. API RESPONSE PRINCIPLE

All APIs must return predictable JSON.

Use:

- DTOs/types
- validation
- consistent error responses
- HTTP status codes

Do not expose database internals directly.

---

# 23. SECURITY

API keys must never be committed to Git.

Use environment variables.

Example:

LLM_API_KEY=
DATABASE_URL=
N8N_WEBHOOK_SECRET=

Use:

.env.local

and provide:

.env.example

The frontend must never receive private API keys.

LLM requests must originate from the backend.

---

# 24. SYNTHETIC DATA

The prototype uses synthetic data.

The dataset should contain enough variation to demonstrate:

- increasing revenue
- declining contribution
- increased discount usage
- low-margin product growth
- high-margin product opportunity

The dataset should be deterministic/reproducible.

Do not claim synthetic data is real Paytm merchant data.

---

# 24.1. STARTUP INITIALIZATION & MERCHANT CONTEXT

The system supports multiple synthetic merchants. For demo purposes, the frontend allows selecting a target merchant (defaulting to demo merchantId = 1, `Brew & Bean Artisan Café`).

On application startup/initialization:

1. Ensure synthetic seed merchants exist (10 demo merchants).
2. Ensure synthetic products and orders exist across all merchants.
3. For each merchant (or upon demo selection):
   a. Check for existing persisted Insights.
   b. If no insights exist for STANDARD or PREMIUM merchants:
      i. Run Economic Engine.
      ii. Run Detection Engine.
      iii. Run AI Reasoning Engine (gated by plan).
      iv. Validate AI output.
      v. Persist the Insight.

n8n may subsequently trigger `INSIGHT_REFRESH` per merchant to update insights.

This guarantees the demo golden path works immediately on first load for any selected demo merchant.

---

# 25. DEMO GOLDEN PATH

The final prototype must support:

LOGIN / OPEN DEMO
    ↓
MERCHANT DASHBOARD
    ↓
PROBLEM DETECTED
    ↓
WHY?
    ↓
AI EXPLANATION
    ↓
SIMULATE
    ↓
SCENARIO RESULT
    ↓
MERCHANT APPROVAL
    ↓
7-DAY EXPERIMENT
    ↓
EXPERIMENT RESULT
    ↓
LEARNING

This is more important than additional features.

---

# 26. DEVELOPMENT PRINCIPLES

The implementation agent must:

1. Follow this document as the source of truth.
2. Not invent additional architecture.
3. Not add unnecessary technologies.
4. Not add unnecessary features.
5. Keep modules separated.
6. Write tests for deterministic calculations.
7. Validate all external AI output.
8. Keep financial calculations deterministic.
9. Keep AI reasoning separate from calculations.
10. Keep n8n orchestration separate from core business logic.
11. Prefer simple working code over over-engineering.
12. Optimize for a functional one-day hackathon prototype.

If an architectural decision is ambiguous, identify the ambiguity instead of silently creating a new architecture.