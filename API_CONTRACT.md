# PAYTM SENTINEL — API CONTRACT

Version: 1.1
Status: MVP (Multi-Merchant & Subscription Tier Synchronized)
Merchant Context: Multi-Merchant (10 demo merchants; default demo merchantId = 1)
Base URL: /api

This document is the single source of truth for communication between:

- Frontend
- Backend
- AI Engine
- n8n

Do not change request/response structures without updating this document.

---

# 1. GLOBAL RULES

## Merchant Context & Selection

The system supports 10 synthetic demo merchants.

No authentication or login registration is required.

All merchant-scoped API endpoints accept an explicit `merchantId` parameter (via `?merchantId=...` query parameter on GET requests or body/query context).

If `merchantId` is omitted, the backend defaults to `merchantId = 1` (`Brew & Bean Artisan Café`, PREMIUM tier).

---

## Response Format & Feature Gating

All successful API responses use JSON.

Feature availability is controlled authoritatively by the backend based on `Merchant.plan` (`FREE`, `STANDARD`, `PREMIUM`). If an endpoint or feature is restricted by tier, the backend responds with HTTP 403:

```json
{
  "error": {
    "code": "FEATURE_NOT_AVAILABLE",
    "message": "This feature requires a STANDARD or PREMIUM subscription plan."
  }
}
```

All other errors use:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

---

# 1.1. GET MERCHANTS (Demo Selection)

## Endpoint

GET /api/merchants

Returns the list of available synthetic demo merchants for dashboard switching.

## Response

```json
{
  "merchants": [
    {
      "id": 1,
      "name": "Brew & Bean Artisan Café",
      "businessType": "CAFÉ",
      "area": "Connaught Place, New Delhi",
      "plan": "PREMIUM"
    },
    {
      "id": 2,
      "name": "The Daily Grind Coffee House",
      "businessType": "CAFÉ",
      "area": "Connaught Place, New Delhi",
      "plan": "STANDARD"
    },
    {
      "id": 3,
      "name": "Chai & Co. Express",
      "businessType": "CAFÉ",
      "area": "Connaught Place, New Delhi",
      "plan": "FREE"
    }
  ]
}
```

---

# 2. GET MERCHANT METRICS

## Endpoint

GET /api/merchant/metrics

## Query Parameters

- `merchantId` (optional, integer, default: 1)
- `period` (allowed values: `LAST_7_DAYS`, `LAST_30_DAYS`)

Example:

GET /api/merchant/metrics?merchantId=1&period=LAST_7_DAYS

The backend automatically compares the selected period with the immediately preceding equivalent period.

Available for all subscription plans (`FREE`, `STANDARD`, `PREMIUM`).

---

## Response

{
  "merchantId": 1,
  "period": "LAST_7_DAYS",
  "comparisonPeriod": "PREVIOUS_7_DAYS",

  "revenue": 251400,
  "revenueChange": 8.2,

  "cogs": 142000,

  "discounts": 21500,

  "contribution": 87900,
  "contributionChange": -4.1,

  "contributionMargin": 34.97,

  "orders": 840,
  "ordersChange": 5.3,

  "averageOrderValue": 299.29
}

---

# 3. GET PRODUCTS

## Endpoint

GET /api/products

## Query Parameters

- `merchantId` (optional, integer, default: 1)

Example:

GET /api/products?merchantId=1

---

## Response

{
  "products": [
    {
      "id": 101,
      "name": "Premium Coffee",
      "category": "BEVERAGE",
      "sellingPrice": 299,
      "costPrice": 120,
      "marginPercent": 59.87
    }
  ]
}

---

# 4. GET INSIGHTS

## Endpoint

GET /api/insights

## Query Parameters

- `merchantId` (optional, integer, default: 1)

Returns persisted Sentinel insights for the specified merchant.

**Gating**: Requires `STANDARD` or `PREMIUM` plan. For `FREE` merchants, returns an empty list or HTTP 403 `FEATURE_NOT_AVAILABLE`.

---

## Response

{
  "insights": [
    {
      "id": 1,
      "merchantId": 1,

      "issueType": "DISCOUNT_LEAK",
      "severity": "HIGH",

      "title": "Profit leak detected",

      "description": "Discount-heavy orders are increasing while contribution per order is declining.",

      "signals": {
        "revenueChange": 8.2,
        "contributionChange": -4.1,
        "discountOrderChange": 22.4,
        "lowMarginOrderChange": 18.3
      },

      "aiOutput": {
        "problem": "Revenue is increasing while contribution is declining.",
        "evidence": [
          "Revenue increased by 8.2%.",
          "Contribution decreased by 4.1%.",
          "Discount-heavy orders increased by 22.4%."
        ],
        "probableDriver": "Increased discount-heavy ordering is reducing contribution per order.",
        "confidence": 0.87,
        "recommendations": [
          {
            "action": "INCREASE_PRICE",
            "reason": "A moderate price test could improve contribution if order volume remains sufficiently stable.",
            "simulationRequired": true
          }
        ]
      },

      "createdAt": "2026-09-17T10:00:00Z"
    }
  ]
}

The backend derives display labels from action values as needed.

---

# 5. GET SINGLE INSIGHT

## Endpoint

GET /api/insights/:id

Example:

GET /api/insights/1

Returns the complete persisted insight.

## Response

The response shape is identical to a single item in the insights array from GET /api/insights.

{
  "id": 1,
  "merchantId": 1,

  "issueType": "DISCOUNT_LEAK",
  "severity": "HIGH",

  "title": "Profit leak detected",

  "description": "Discount-heavy orders are increasing while contribution per order is declining.",

  "signals": {
    "revenueChange": 8.2,
    "contributionChange": -4.1,
    "discountOrderChange": 22.4,
    "lowMarginOrderChange": 18.3
  },

  "aiOutput": {
    "problem": "Revenue is increasing while contribution is declining.",
    "evidence": [
      "Revenue increased by 8.2%.",
      "Contribution decreased by 4.1%.",
      "Discount-heavy orders increased by 22.4%."
    ],
    "probableDriver": "Increased discount-heavy ordering is reducing contribution per order.",
    "confidence": 0.87,
    "recommendations": [
      {
        "action": "INCREASE_PRICE",
        "reason": "A moderate price test could improve contribution if order volume remains sufficiently stable.",
        "simulationRequired": true
      }
    ]
  },

  "createdAt": "2026-09-17T10:00:00Z"
}

---

# 6. POST SIMULATION

## Endpoint

POST /api/simulation

The frontend supplies only the decision variable.

The backend retrieves current business data from the database.

The frontend MUST NOT supply:

- current orders
- current revenue
- current contribution
- cost
- historical metrics

These values are backend-owned.

---

## Request — Price Simulation

{
  "productId": 101,
  "changeType": "PRICE",
  "newValue": 319
}

## Request — Discount Simulation

{
  "productId": 101,
  "changeType": "DISCOUNT",
  "newValue": 10
}

changeType must be either PRICE or DISCOUNT.

The backend selects the deterministic simulation model based on changeType.

---

## Response

{
  "productId": 101,

  "current": {
    "price": 299,
    "orders": 840,
    "revenue": 251160,
    "contribution": 67200
  },

  "scenario": {
    "price": 319,
    "projectedOrders": 805,
    "projectedRevenue": 256795,
    "projectedContribution": 80500
  },

  "impact": {
    "contributionDifference": 13300,
    "contributionDifferencePercent": 19.79,
    "orderDifference": -35,
    "orderDifferencePercent": -4.17
  },

  "model": {
    "type": "LINEAR_PRICE_ELASTICITY",
    "elasticity": 0.8
  }
}

---

# 7. CREATE EXPERIMENT

## Endpoint

POST /api/experiments

Creates a DRAFT experiment.

It MUST NOT automatically start the experiment.

---

## Request

{
  "insightId": 1,
  "productId": 101,

  "type": "PRICE_TEST",

  "oldValue": 299,
  "newValue": 319,

  "durationDays": 7,

  "metric": "CONTRIBUTION"
}

---

## Response

{
  "id": 1,

  "merchantId": 1,
  "insightId": 1,
  "productId": 101,

  "type": "PRICE_TEST",

  "oldValue": 299,
  "newValue": 319,

  "durationDays": 7,
  "metric": "CONTRIBUTION",

  "status": "DRAFT",

  "startedAt": null,
  "completedAt": null
}

---

# 8. APPROVE EXPERIMENT

## Endpoint

POST /api/experiments/:id/approve

Example:

POST /api/experiments/1/approve

This is the explicit merchant approval gate.

Only an experiment with:

status = DRAFT

may be approved.

---

## Response

{
  "id": 1,
  "status": "RUNNING",
  "approved": true,
  "startedAt": "2026-09-17T12:00:00Z"
}

---

# 9. GET EXPERIMENT

## Endpoint

GET /api/experiments/:id

Example:

GET /api/experiments/1

---

## Response

{
  "id": 1,

  "merchantId": 1,
  "insightId": 1,
  "productId": 101,

  "type": "PRICE_TEST",

  "oldValue": 299,
  "newValue": 319,

  "durationDays": 7,

  "metric": "CONTRIBUTION",

  "status": "RUNNING",

  "startedAt": "2026-09-17T12:00:00Z",
  "completedAt": null
}

---

# 10. GET EXPERIMENT RESULT

## Endpoint

GET /api/experiments/:id/result

Example:

GET /api/experiments/1/result

The backend calculates the result deterministically.

---

## Response

{
  "experimentId": 1,

  "status": "COMPLETED",

  "baseline": {
    "contribution": 67200,
    "orders": 840
  },

  "result": {
    "contribution": 78900,
    "orders": 812
  },

  "impact": {
    "contributionDifference": 11700,
    "contributionChangePercent": 17.41,
    "orderDifference": -28,
    "orderChangePercent": -3.33
  }
}

## Internal ExperimentResultDTO

The public response above is for frontend consumption.

The AI receives the canonical internal ExperimentResultDTO defined in ARCHITECTURE.md §19:

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

The backend maps the internal DTO to both the public REST response and the AI input. These are NOT the same object.

---

# 11. N8N WEBHOOK

## Endpoint

POST /api/webhooks/n8n

This endpoint accepts authenticated requests from n8n.

Authentication:

Authorization: Bearer <N8N_WEBHOOK_SECRET>

The backend rejects requests with an invalid or missing secret.

---

## Request

{
  "event": "EXPERIMENT_CHECK",

  "experimentId": 1,

  "timestamp": "2026-09-17T12:00:00Z"
}

---

## Supported Events

EXPERIMENT_CHECK

EXPERIMENT_COMPLETE

INSIGHT_REFRESH

---

# 12. N8N — EXPERIMENT CHECK

When n8n sends:

{
  "event": "EXPERIMENT_CHECK",
  "experimentId": 1
}

The backend:

1. Validates the experiment.
2. Retrieves experiment information.
3. Calculates current metrics.
4. Returns deterministic metrics.
5. Does not allow n8n to modify financial calculations.

---

## Response

{
  "experimentId": 1,

  "status": "RUNNING",

  "metrics": {
    "orders": 812,
    "contribution": 78900
  }
}

---

# 13. N8N — EXPERIMENT COMPLETE

Request:

{
  "event": "EXPERIMENT_COMPLETE",
  "experimentId": 1
}

Backend:

1. Validates experiment.
2. Calculates final result.
3. Marks experiment COMPLETED.
4. Persists result.
5. Returns result data.

---

## Response

{
  "experimentId": 1,

  "status": "COMPLETED",

  "contributionChangePercent": 17.41,

  "orderChangePercent": -3.33
}

---

# 14. INSIGHT REFRESH

n8n may trigger:

POST /api/webhooks/n8n

Request:

{
  "event": "INSIGHT_REFRESH"
}

Backend:

1. Calculates current economic metrics.
2. Runs Detection Engine.
3. Determines issue type.
4. Determines severity.
5. Determines allowed actions.
6. Calls AI Reasoning Engine.
7. Validates AI output.
8. Persists the resulting Insight.

---

# 15. AI RECOMMENDATION INTERNAL CONTRACT

The AI service is NOT directly exposed as a public endpoint.

The backend internally calls the AI engine.

Input:

{
  "merchant": {
    "id": 1,
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

# 16. AI OUTPUT

The AI must return:

{
  "problem": "Revenue is increasing while contribution is declining.",

  "evidence": [
    "Revenue increased by 8.2%.",
    "Contribution decreased by 4.1%.",
    "Discount-heavy orders increased by 22.4%."
  ],

  "probableDriver": "Increased discount-heavy ordering is reducing contribution per order.",

  "confidence": 0.87,

  "recommendations": [
    {
      "action": "INCREASE_PRICE",
      "reason": "A moderate price test could improve contribution if order volume remains sufficiently stable.",
      "simulationRequired": true
    }
  ]
}

The AI MUST NOT create numerical values that were not supplied by the backend.

---

# 17. ERROR HANDLING

## Invalid product

HTTP 404

{
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product not found."
  }
}

---

## Invalid experiment

HTTP 404

{
  "error": {
    "code": "EXPERIMENT_NOT_FOUND",
    "message": "Experiment not found."
  }
}

---

## Invalid experiment state

HTTP 409

{
  "error": {
    "code": "INVALID_EXPERIMENT_STATE",
    "message": "Only DRAFT experiments can be approved."
  }
}

---

## Invalid n8n authentication

HTTP 401

{
  "error": {
    "code": "UNAUTHORIZED_N8N_REQUEST",
    "message": "Invalid n8n authentication."
  }
}

---

# 18. DATA OWNERSHIP

Frontend:

- Displays data.
- Sends merchant decisions.
- Never owns authoritative financial calculations.

Backend:

- Owns financial calculations.
- Owns detection.
- Owns simulation.
- Owns experiment state.
- Owns AI orchestration.
- Owns validation.

AI:

- Reasons over supplied facts.
- Explains.
- Recommends.
- Interprets.

n8n:

- Orchestrates workflows.
- Triggers backend operations.
- Monitors experiments.
- Does not own economic calculations.

---

# 19. GOLDEN PATH API FLOW

GET /api/merchant/metrics
        ↓
GET /api/insights
        ↓
POST /api/simulation
        ↓
POST /api/experiments
        ↓
POST /api/experiments/:id/approve
        ↓
n8n
        ↓
POST /api/webhooks/n8n
        ↓
GET /api/experiments/:id/result

---

# 20. MVP RULE

Do not add endpoints unless they are required for:

DETECT
→ DIAGNOSE
→ SIMULATE
→ EXPERIMENT
→ MEASURE
→ LEARNs