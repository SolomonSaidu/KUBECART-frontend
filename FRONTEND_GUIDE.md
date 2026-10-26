# Kubecart Backend — Frontend Integration Guide

This guide documents the API contract implemented in this repository for a frontend developer or AI agent. It is based on the current source, validators, Prisma schema, and automated tests. Where a behavior is not implemented or cannot be verified from this repository, it is called out explicitly.

## 1. Base URL and environment

| Item | Value |
| --- | --- |
| Production API base | `https://kubecart-backend.onrender.com` |
| API prefix | `/api/v1` |
| Example | `https://kubecart-backend.onrender.com/api/v1/products` |
| Content type | `application/json` except multipart image uploads |
| Money | Integer **kobo** (₦1 = 100 kobo) |
| Currency | `NGN` in the implemented checkout/payment flow |

Set a single frontend API base variable, for example:

```js
const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api/v1`;
```

CORS is an exact, comma-separated origin allowlist configured by the backend's `CORS_ORIGIN` environment variable. Credentials are enabled, so the frontend's origin must match an allowed value exactly; wildcards are not used. The repository only shows the development default (`http://localhost:5173`). The deployed allowlist cannot be verified from this repository.

## 2. Request conventions

- Send JSON with `Content-Type: application/json`.
- JSON request bodies are limited to **10 KB**. Larger JSON bodies return `413`.
- Product image uploads are `multipart/form-data` and limited to **5 MB**.
- Every response includes an `x-request-id` header. Most error bodies also include `requestId`.
- IDs shown as UUIDs are UUID strings.
- References such as `KBC-1A2B3C4D5E6F` and `PAY-KBC-...` are strings.
- Timestamps are ISO 8601 strings.
- Pagination responses use `totalPages = max(1, ceil(total / limit))`, so an empty result has `totalPages: 1`.
- Rate limits return `429` with `{ "error": "Too Many Requests", "message": "..." }`.

## 3. Authentication (admin)

Admin authentication supports either a Bearer token or cookies. **Bearer is the safer choice for a separately hosted frontend.**

### 3.1 Bootstrap the first admin

`POST /api/v1/admin/bootstrap`

Public. Intended only for initial setup. Rate limited to **5 requests per hour per IP**.

```json
{
  "email": "admin@example.com",
  "password": "at-least-8-characters",
  "name": "Admin"
}
```

Bootstrap validation is weaker than login validation: the controller only checks that all three fields are present. Use a valid email and a password of at least 8 characters anyway, because login applies the stricter schema and a shorter bootstrap password would make the account unable to log in.

Success: `201`

```json
{
  "message": "Admin bootstrapped successfully",
  "data": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "Admin",
    "createdAt": "2026-10-21T10:00:00.000Z"
  }
}
```

Errors:
- `400` when email, password, or name is missing.
- `409` when any admin already exists. Bootstrap is not a normal signup endpoint.

### 3.2 Login

`POST /api/v1/admin/login`

Public. Rate limited to **5 attempts per 15 minutes per IP**.

```json
{
  "email": "admin@example.com",
  "password": "at-least-8-characters"
}
```

Success: `200`

```json
{
  "message": "Login successful",
  "token": "jwt",
  "csrfToken": "hex-string",
  "admin": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "Admin"
  }
}
```

The response also sets two cookies:

| Cookie | HttpOnly | Purpose |
| --- | --- | --- |
| `admin_token` | Yes | JWT for cookie authentication |
| `admin_csrf` | No | CSRF token; its value is also returned as `csrfToken` |

Cookie attributes: `sameSite: 'lax'`, `secure: true` in production, `path: '/'`, `maxAge` 24 hours. The JWT also expires after **24 hours**.

### 3.3 Using the token

Send one of:

```http
Authorization: Bearer <token>
```

or, for cookie auth, send cookies plus the CSRF header on state-changing requests:

```http
x-csrf-token: <csrfToken>
```

Rules implemented by the backend:

- `Authorization: Bearer ...` takes precedence over the cookie.
- If a non-empty Bearer token is present, cookie fallback is not used, even if the Bearer token is invalid.
- Cookie authentication on `POST`, `PUT`, `PATCH`, or `DELETE` requires `x-csrf-token` to match the `admin_csrf` cookie.
- `GET`, `HEAD`, and `OPTIONS` do not require CSRF validation.
- Bearer authentication does not require CSRF validation.

`GET /api/v1/admin/me`

Protected. Returns the current admin.

```json
{
  "admin": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "Admin"
  }
}
```

`POST /api/v1/admin/logout`

This route is intentionally public/idempotent: it has CSRF protection for cookie auth but **does not require a valid admin token**. It clears the two cookies and returns `200`:

```json
{ "message": "Logged out successfully" }
```

JWTs are stateless and are **not revoked** by logout. A copied/stale Bearer token remains valid until its 24-hour expiry. The frontend must discard its token on logout; clearing cookies alone does not invalidate a token stored in JavaScript.

### 3.4 Browser cookie risk

The cookies use `SameSite=Lax`. If the frontend and API are on different registrable sites (for example `vercel.app` calling `onrender.com`), browsers will not send these cookies on cross-site `fetch`/XHR requests, even with `credentials: 'include'`. Bearer authentication avoids this problem. If cookie auth is required, host the frontend and API on the same site (for example subdomains of the same domain) or change the cookie policy, which would be a backend change.

When using cookies, the frontend must use `credentials: 'include'` and send `x-csrf-token` on mutations. The login response body is the simplest source for the CSRF value.

## 4. Error model

Most errors have this shape:

```json
{
  "error": "Bad Request",
  "message": "Human-readable explanation",
  "requestId": "uuid",
  "issues": []
}
```

`issues` appears for Zod validation failures. `requestId` is generally present but not guaranteed on every response (for example rate-limit responses and the invalid-webhook response). In development, unexpected errors may also include `stack`; production omits it.

Common statuses:

| Status | Meaning in this API |
| --- | --- |
| `200` | Success, or idempotent checkout/replacement/update |
| `201` | Resource created (order, category, product, image) |
| `204` | Category deleted; empty body |
| `400` | Validation failure, invalid transition input, payment amount/currency/status failure |
| `401` | Missing/invalid/expired admin token, wrong login credentials, invalid webhook signature |
| `403` | Missing/invalid CSRF token, or disallowed CORS origin |
| `404` | Unknown route, category, product, order, payment, or image to replace |
| `409` | Insufficient stock, duplicate bootstrap, invalid order transition, image limit |
| `410` | Inventory reservation expired when initializing payment |
| `413` | JSON body over 10 KB or image over 5 MB |
| `429` | Rate limit exceeded |
| `500` | Unhandled server/database error; production response is generic |
| `502` | Product image storage upload failure |
| `503` | Database readiness check failed |

For non-500 errors originating from service code, the `error` value is usually the JavaScript error name (often `"Error"`), not a stable machine code. **Branch on HTTP status and, where needed, the documented `message`; do not depend on `error` being a stable enum.**

## 5. Public catalogue

These endpoints require no authentication.

### 5.1 List categories

`GET /api/v1/categories`

Returns all categories ordered by name ascending, with a count of active products.

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Electronics",
      "slug": "electronics",
      "description": "Electronic devices",
      "createdAt": "2026-10-21T10:00:00.000Z",
      "updatedAt": "2026-10-21T10:00:00.000Z",
      "_count": { "products": 3 }
    }
  ]
}
```

`_count.products` counts only `isActive: true` products.

### 5.2 Category detail

`GET /api/v1/categories/:slug`

Returns the category plus its active products, with images ordered primary first, then `sortOrder`.

```json
{
  "data": {
    "id": "uuid",
    "name": "Electronics",
    "slug": "electronics",
    "description": "Electronic devices",
    "createdAt": "2026-10-21T10:00:00.000Z",
    "updatedAt": "2026-10-21T10:00:00.000Z",
    "products": [
      {
        "id": "uuid",
        "categoryId": "uuid",
        "name": "Wireless Mouse",
        "slug": "wireless-mouse",
        "description": "…",
        "priceKobo": 500000,
        "currency": "NGN",
        "stock": 12,
        "isActive": true,
        "images": [
          {
            "id": "uuid",
            "productId": "uuid",
            "url": "https://signed-url…",
            "storagePath": "products/uuid/file.png",
            "sortOrder": 0,
            "isPrimary": true,
            "createdAt": "2026-10-21T10:00:00.000Z"
          }
        ],
        "createdAt": "2026-10-21T10:00:00.000Z",
        "updatedAt": "2026-10-21T10:00:00.000Z"
      }
    ]
  }
}
```

`404` if the slug does not exist. This endpoint has no pagination for the embedded products list.

### 5.3 List products

`GET /api/v1/products`

Query parameters:

| Parameter | Rules | Default |
| --- | --- | --- |
| `page` | Coerced to at least 1; non-numeric falls back to 1 | `1` |
| `limit` | Coerced to 1–50; non-numeric falls back to 12 | `12` |
| `search` | Case-insensitive contains on name and description | — |
| `categorySlug` | Exact category slug | — |
| `categoryId` | Exact category UUID; takes precedence over `categorySlug` | — |
| `sort` | `newest`, `price:asc`, `price:desc`, `name:asc` | `newest` |

An invalid `sort` value returns `400` with validation `issues`. `page` and `limit` are clamped rather than rejected.

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "categoryId": "uuid",
      "name": "Wireless Mouse",
      "slug": "wireless-mouse",
      "description": "…",
      "priceKobo": 500000,
      "currency": "NGN",
      "stock": 12,
      "isActive": true,
      "category": {
        "id": "uuid",
        "name": "Electronics",
        "slug": "electronics",
        "description": "Electronic devices",
        "createdAt": "2026-10-21T10:00:00.000Z",
        "updatedAt": "2026-10-21T10:00:00.000Z"
      },
      "images": [],
      "createdAt": "2026-10-21T10:00:00.000Z",
      "updatedAt": "2026-10-21T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 1,
    "totalPages": 1
  }
}
```

Only active products are returned. The frontend should treat `stock === 0` as unavailable but should still handle `409` at checkout, because stock can change.

### 5.4 Product detail

`GET /api/v1/products/:slug`

Returns one active product with its category and images. `404` if the product does not exist or is inactive.

### 5.5 Image URLs and expiry

Images stored in the private Supabase bucket are returned as **signed URLs that expire after 1 hour**. External HTTP(S) image URLs are returned unchanged. The response may also include `storagePath`; treat it as opaque and do not display it.

Frontend implications:
- Do not cache signed image URLs indefinitely.
- Re-fetch product/category data when images fail or after roughly an hour.
- Do not construct storage URLs yourself.

## 6. Checkout and public order lookup

### 6.1 Create an order

`POST /api/v1/checkout`

Public. Rate limited to **30 requests per 15 minutes per IP**. Optionally send an `idempotency-key` header.

```http
POST /api/v1/checkout
Content-Type: application/json
idempotency-key: 7f4c2c1e-...
```

```json
{
  "email": "customer@example.com",
  "phone": "+2348012345678",
  "shippingAddress": "1 Test Street, Lagos",
  "items": [
    { "productId": "uuid", "quantity": 2 }
  ]
}
```

Validation:
- `email` must be a valid email.
- `phone` length 7–20.
- `shippingAddress` length 5–500.
- `items` must contain at least one item.
- `productId` must be a UUID.
- `quantity` must be a positive integer.
- Duplicate product IDs are allowed by validation but result in separate line items and separate reservations for the same product.

The server ignores any client-supplied price. It reloads active products and computes:

```text
subtotalKobo = sum(product.priceKobo * quantity)
totalKobo    = subtotalKobo + DEFAULT_DELIVERY_FEE_KOBO
```

`DEFAULT_DELIVERY_FEE_KOBO` is server configuration; the repository default is `150000` (₦1,500). The client cannot choose a delivery fee or shipping method.

Success when newly created: `201`

```json
{
  "message": "Order created successfully",
  "data": {
    "id": "uuid",
    "reference": "KBC-A1B2C3D4E5F6",
    "email": "customer@example.com",
    "phone": "+2348012345678",
    "shippingAddress": "1 Test Street, Lagos",
    "subtotalKobo": 1000000,
    "deliveryFeeKobo": 150000,
    "totalKobo": 1150000,
    "currency": "NGN",
    "status": "PENDING",
    "paymentStatus": "UNPAID",
    "fulfillmentStatus": "UNFULFILLED",
    "idempotencyKey": "7f4c2c1e-...",
    "requiresManualReview": false,
    "inventoryReconciledAt": null,
    "createdAt": "2026-10-21T10:00:00.000Z",
    "updatedAt": "2026-10-21T10:00:00.000Z",
    "items": [
      {
        "id": "uuid",
        "orderId": "uuid",
        "productId": "uuid",
        "productName": "Wireless Mouse",
        "unitPriceKobo": 500000,
        "quantity": 2
      }
    ],
    "reservations": [
      {
        "id": "uuid",
        "productId": "uuid",
        "orderId": "uuid",
        "quantity": 2,
        "status": "ACTIVE",
        "expiresAt": "2026-10-21T10:15:00.000Z",
        "createdAt": "2026-10-21T10:00:00.000Z",
        "updatedAt": "2026-10-21T10:00:00.000Z"
      }
    ]
  }
}
```

Behavior:
- Stock is decremented immediately inside the checkout transaction.
- An `ACTIVE` reservation is created for each item and expires after `INVENTORY_RESERVATION_MINUTES` (repository default: 15 minutes).
- If a product is missing or inactive: `400`.
- If stock is insufficient: `409` with a message like `Insufficient stock for 'Product'. Available: 1, Requested: 2`.
- A duplicate `idempotency-key` returns `200` with `"Order retrieved (idempotent request)"` and the previously created order. That duplicate response includes `items` but **does not include `reservations`**. Idempotency is a global unique key; the first request wins. Simultaneous requests with the same new key are not explicitly handled beyond the database unique constraint, so do not rely on that race producing a clean `200`.

Idempotency guidance:
- Generate one UUID key per checkout attempt and reuse it only for retries of that same order.
- Do not reuse a key for a changed cart.
- The key is persisted on the order and exposed as `idempotencyKey`.

### 6.2 Public order lookup

`GET /api/v1/checkout/:reference`

Public. Returns a limited order view without email, phone, address, or payment internals.

```json
{
  "data": {
    "reference": "KBC-A1B2C3D4E5F6",
    "subtotalKobo": 1000000,
    "deliveryFeeKobo": 150000,
    "totalKobo": 1150000,
    "currency": "NGN",
    "status": "PENDING",
    "paymentStatus": "UNPAID",
    "fulfillmentStatus": "UNFULFILLED",
    "createdAt": "2026-10-21T10:00:00.000Z",
    "items": [
      {
        "productName": "Wireless Mouse",
        "unitPriceKobo": 500000,
        "quantity": 2
      }
    ]
  }
}
```

`404` if the reference is unknown. This is the appropriate endpoint for polling order state after checkout/payment; do not poll payment verification to watch status.

## 7. Payments (Paystack)

Payments are server-side Paystack transactions in **NGN kobo**. The client never submits an amount.

### 7.1 Initialize payment

`POST /api/v1/payments/initialize`

Public. Rate limited to **60 requests per 15 minutes per IP**.

```json
{
  "orderReference": "KBC-A1B2C3D4E5F6",
  "callbackUrl": "https://frontend.example.com/payment/callback"
}
```

`callbackUrl` is optional and must be an absolute URL. Success: `200`

```json
{
  "message": "Payment initialized successfully",
  "data": {
    "paymentId": "uuid",
    "reference": "PAY-KBC-A1B2C3D4E5F6-ABCD1234",
    "authorizationUrl": "https://checkout.paystack.com/…",
    "accessCode": "…"
  }
}
```

Frontend flow:
1. Create the order.
2. Initialize payment and redirect the customer to `authorizationUrl`.
3. Paystack redirects back to `callbackUrl` with its query parameters (commonly `reference`).
4. Extract the payment reference and call the verify endpoint below.

Errors:
- `404` order not found.
- `400` order already paid.
- `400` order is cancelled.
- `410` when the order had reservations but none are both `ACTIVE` and unexpired. The customer must create a new order.
- If Paystack initialization fails after the pending payment row is created, the attempt is marked `FAILED`; the request returns the underlying error status/message.

Each successful initialize creates a new `Payment` row with status `PENDING`. There is no endpoint to fetch or reuse a previous attempt.

### 7.2 Verify payment

`GET /api/v1/payments/verify/:reference`

Public. Rate limited with the payment limiter. This endpoint **mutates state** and must be called after Paystack redirects back.

Success: `200`

```json
{
  "message": "Payment verified successfully",
  "data": {
    "isAlreadyProcessed": false,
    "isCancelledOrder": false,
    "payment": { "…": "current payment row" },
    "order": { "…": "current order row" },
    "reconciliation": {
      "success": true,
      "requiresManualReview": false,
      "alreadyReconciled": false
    }
  }
}
```

Verification checks:
- Paystack transaction status must be `success`.
- Amount must exactly equal the order/payment amount in kobo.
- Currency must exactly equal the payment currency (`NGN`).

Failure behavior:
- `404` unknown local payment reference.
- `400` Paystack status is not success; local attempt becomes `FAILED` or `ABANDONED`.
- `400` amount mismatch; attempt becomes `FAILED` and the order is flagged `requiresManualReview: true`.
- `400` currency mismatch; attempt becomes `FAILED` and the order is flagged `requiresManualReview: true`.

On success:
- Payment becomes `SUCCESS` with Paystack's transaction ID stored as `externalId`.
- An active order becomes `paymentStatus: PAID`, `status: CONFIRMED`.
- Inventory reservations are consumed or reconciled.
- A cancelled order stays `CANCELLED`; payment becomes `PAID`, `requiresManualReview` becomes `true`, and reconciliation is skipped with:

```json
{
  "success": false,
  "requiresManualReview": true,
  "skipped": true,
  "reason": "Order is cancelled; verified payment requires manual refund review"
}
```

Repeated verification is idempotent:
- If the payment is already `SUCCESS` and the order is already `PAID`, the backend does not call Paystack again and returns `isAlreadyProcessed: true`.
- If inventory reconciliation was previously incomplete, it may be retried.
- `isCancelledOrder: true` tells the frontend to show a "payment received, support review required" state rather than an order success state.

Never trust the redirect alone. The frontend should only show payment success after the verify response confirms it, or after the public order lookup reports `paymentStatus: PAID`.

### 7.3 Paystack webhook

`POST /api/v1/payments/webhook`

Paystack-facing endpoint. The frontend must not call it. It is exempt from the global API rate limiter. The backend verifies the raw request body with HMAC-SHA512 using the `x-paystack-signature` header.

- Invalid signature: `401` `{ "error": "Unauthorized", "message": "Invalid Paystack webhook signature" }`.
- Only `charge.success` events are processed.
- Success response: `200` with `received: true`, plus `handled`, `isDuplicate`, and possibly `result`/`reconciliation`.
- Unknown events/references return `200` with `handled: false` so Paystack does not retry endlessly.

Webhook duplicate delivery is idempotent. Do not implement payment success on the frontend by listening for this webhook.

## 8. Admin category management

All routes require admin authentication. With cookie auth, mutations require `x-csrf-token`.

### 8.1 Create category

`POST /api/v1/admin/categories`

```json
{
  "name": "Smartphones",
  "slug": "smartphones",
  "description": "Mobile phones"
}
```

Rules:
- `name`: 1–100 characters, unique.
- `slug`: 1–100 characters, lowercase alphanumeric with single hyphens, unique.
- `description`: optional string.

Success: `201`

```json
{
  "data": {
    "id": "uuid",
    "name": "Smartphones",
    "slug": "smartphones",
    "description": "Mobile phones",
    "createdAt": "…",
    "updatedAt": "…"
  }
}
```

### 8.2 Update category

`PUT /api/v1/admin/categories/:id`

Body may contain any of `name`, `slug`, `description`; `description` may be set to `null`. All fields are optional. Success: `200` with `{ "data": category }`.

### 8.3 Delete category

`DELETE /api/v1/admin/categories/:id`

Success: `204` with an empty body.

## 9. Admin product management

All routes require admin authentication. With cookie auth, mutations require `x-csrf-token`.

### 9.1 Create product

`POST /api/v1/admin/products`

```json
{
  "categoryId": "uuid",
  "name": "Pro Laptop",
  "slug": "pro-laptop",
  "description": "High performance laptop",
  "priceKobo": 95000000,
  "currency": "NGN",
  "stock": 5,
  "isActive": true,
  "images": [
    {
      "url": "https://example.com/pic.png",
      "sortOrder": 0,
      "isPrimary": true
    }
  ]
}
```

Rules:
- `categoryId`: UUID.
- `name`: 1–255 characters.
- `slug`: 1–255 characters, lowercase alphanumeric with single hyphens, unique.
- `description`: at least 1 character.
- `priceKobo`: positive integer.
- `currency`: string, default `NGN`.
- `stock`: non-negative integer, default `0`.
- `isActive`: boolean, default `true`.
- `images`: optional, maximum 10. Each URL must be HTTP(S), at most 2048 characters. `sortOrder` defaults to `0`; `isPrimary` defaults to `false`.

Success: `201` with `{ "data": product }`, including `category` and ordered `images`.

### 9.2 Update product

`PUT /api/v1/admin/products/:id`

Same fields as create, all optional. If `images` is provided, it **replaces all existing image records** for the product. Existing image records with storage paths are deleted, and their storage objects are removed after the database transaction succeeds. This means:

- Supplying `images` via this endpoint is destructive; it is not a merge.
- It cannot preserve the private `storagePath` of uploaded images unless you re-upload them.
- Use the dedicated image upload/replace endpoint for private images.

Success: `200` with `{ "data": product }`.

### 9.3 Activate/deactivate product

- `PATCH /api/v1/admin/products/:id/activate`
- `PATCH /api/v1/admin/products/:id/deactivate`

Both return `200` with `{ "data": product }` containing the updated base product fields (`isActive` reflects the change).

Deactivating a product hides it from public catalogue endpoints. It does not delete it or affect existing orders.

### 9.4 Upload or replace a product image

`POST /api/v1/admin/products/:productId/image`

`multipart/form-data`:

| Part | Required | Rules |
| --- | --- | --- |
| `image` | Yes | Exactly one file, JPEG/PNG/WebP, maximum 5 MB |
| `isPrimary` | No | `"true"` or `"false"`; other values fail validation |
| `sortOrder` | No | Integer 0–1000 |
| `replaceImageId` | No | UUID of an existing image belonging to this product |

The file type is detected from the file bytes, not from the filename or declared MIME type. A product can have at most 10 images unless an existing image is replaced.

Success:
- New image: `201` with `{ "message": "Product image uploaded", "data": image }`.
- Replacement: `200` with `{ "message": "Product image replaced", "data": image }`.

The returned image includes a fresh signed `url` (1-hour expiry) and `storagePath`.

Errors:
- `400` missing image, unsupported image format, or invalid multipart fields.
- `401` unauthenticated (checked before multipart parsing).
- `404` product not found or `replaceImageId` does not belong to the product.
- `409` would exceed 10 images.
- `413` file larger than 5 MB.
- `502` storage provider upload failure.
- `500` database write failure; the newly uploaded object is cleaned up.

There is no standalone image-delete, image-list, or image-reorder endpoint. Reordering can only be done by supplying a complete `images` array via `PUT /admin/products/:id` (destructive) or by replacing images with new `sortOrder` values. If `isPrimary: true` is set, other images for the product are unset as primary.

## 10. Admin order management

All routes require admin authentication. `PATCH` requires CSRF when using cookie auth.

### 10.1 List orders

`GET /api/v1/admin/orders`

Query parameters:

| Parameter | Rules | Default |
| --- | --- | --- |
| `page` | At least 1; non-numeric falls back to 1 | `1` |
| `limit` | 1–100; non-numeric falls back to 20 | `20` |
| `status` | `PENDING`, `CONFIRMED`, `CANCELLED` | — |
| `paymentStatus` | `UNPAID`, `PAID`, `REFUNDED` | — |
| `fulfillmentStatus` | `UNFULFILLED`, `PROCESSING`, `FULFILLED`, `CANCELLED` | — |
| `requiresManualReview` | `"true"` or `"false"` | — |
| `search` | Trimmed, 1–255 characters; case-insensitive contains on reference and email | — |
| `sort` | `newest`, `oldest`, `total:desc`, `total:asc` | `newest` |

Invalid enum values return `400` with `issues`.

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "reference": "KBC-A1B2C3D4E5F6",
      "email": "customer@example.com",
      "subtotalKobo": 1000000,
      "deliveryFeeKobo": 150000,
      "totalKobo": 1150000,
      "currency": "NGN",
      "status": "PENDING",
      "paymentStatus": "UNPAID",
      "fulfillmentStatus": "UNFULFILLED",
      "requiresManualReview": false,
      "createdAt": "2026-10-21T10:00:00.000Z",
      "updatedAt": "2026-10-21T10:00:00.000Z",
      "_count": { "items": 1 }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

The list omits phone, shipping address, items, payments, reservations, and status history.

### 10.2 Order detail

`GET /api/v1/admin/orders/:reference`

Returns:

- All summary fields above, plus `phone` and `shippingAddress`.
- `items`: `id`, `productId`, `productName`, `unitPriceKobo`, `quantity`.
- `payments`: `id`, `reference`, `externalId`, `amountKobo`, `currency`, `status`, `gateway`, `createdAt`, `updatedAt`. Raw webhook payloads are deliberately excluded.
- `reservations`: `id`, `productId`, `quantity`, `status`, `expiresAt`, `createdAt`, `updatedAt`.
- `statusHistory`: ordered oldest-first, with `id`, `field` (`ORDER`/`PAYMENT`/`FULFILLMENT`), `fromStatus`, `toStatus`, `note`, `createdAt`, and optional `admin` `{ id, email, name }`.

`404` if the reference is unknown.

### 10.3 Update fulfillment

`PATCH /api/v1/admin/orders/:reference/fulfillment`

The body is strict; only these fields are accepted:

```json
{
  "status": "PROCESSING",
  "note": "Packing started"
}
```

- `status`: required, one of `PROCESSING`, `FULFILLED`, `CANCELLED`.
- `note`: optional, trimmed, maximum 500 characters.
- Any extra field (for example `paymentStatus`) returns `400` with validation `issues`. Admins cannot write payment or manual-review fields through this endpoint.

Allowed transitions:

| Target | Allowed from | Additional conditions | Side effects |
| --- | --- | --- | --- |
| `PROCESSING` | `UNFULFILLED` | `paymentStatus === PAID`; `requiresManualReview === false` | Status history row |
| `FULFILLED` | `PROCESSING` | `paymentStatus === PAID`; `requiresManualReview === false` | Status history row |
| `CANCELLED` | `UNFULFILLED` or `PROCESSING` | `paymentStatus !== PAID` | Sets `status: CANCELLED` and `fulfillmentStatus: CANCELLED`; releases active reservations and restores stock; writes ORDER and FULFILLMENT history rows |

Repeated identical status is a no-op: it returns `200` with `"Order is already <STATUS>"` and writes nothing. The response for a real transition is:

```json
{
  "message": "Order fulfilment updated to PROCESSING",
  "data": { "…full order detail…" }
}
```

Errors:
- `404` unknown reference.
- `409` invalid source state, skipped transition, unpaid order, manual-review order, attempt to cancel a paid order (`Paid orders cannot be cancelled until a refund workflow is available`), or an optimistic state claim losing a race (`Order state changed while processing this request; reload and retry`).

Fulfillment does **not** decrement stock. Stock is decremented at checkout and reservations are consumed/reconciled when payment succeeds. Cancelling an unpaid order restores stock at most once.

## 11. End-to-end frontend flows

### 11.1 Customer purchase flow

1. Load categories (`GET /categories`) and products (`GET /products`).
2. Load product detail by slug.
3. Build a cart with product UUIDs and positive integer quantities.
4. Create one idempotency key for this checkout attempt.
5. `POST /checkout` with the key. On `201`, keep `data.reference` and `data.totalKobo`.
6. On `409` insufficient stock, refresh the cart/product data. On `400`, fix validation or unavailable products.
7. `POST /payments/initialize` with `orderReference`. Redirect to `data.authorizationUrl`.
8. On the callback page, read the payment `reference` from the redirect (or keep it in frontend state) and call `GET /payments/verify/:reference`.
9. Treat the order as paid only when verify returns `data.order.paymentStatus === "PAID"` and, for a normal order, `data.order.status === "CONFIRMED"`.
10. If `data.isCancelledOrder === true`, show a payment-received/support-review message instead of a normal success page.
11. Optionally poll `GET /checkout/:reference` for display state; do not poll verify unnecessarily.

Notes:
- The reservation window (default 15 minutes) starts at order creation, not at payment initialization. If the customer waits too long, initialize returns `410`; create a new order.
- A cancelled order cannot be paid; initialize returns `400`.
- Multiple initialize calls create multiple payment attempts; only the verified one should be treated as successful.

### 11.2 Admin flow

1. If no admin exists, call bootstrap once; otherwise call login.
2. Prefer Bearer auth for a separately hosted SPA. Store `token` securely and send `Authorization: Bearer <token>`.
3. If using cookies instead: send `credentials: 'include'`, send `x-csrf-token` from `csrfToken` on all mutations, and make sure the frontend/API deployment is same-site enough for `SameSite=Lax` cookies.
4. Use `GET /admin/me` to restore/validate a session.
5. Manage categories, products, image uploads, and order fulfillment with the endpoints above.
6. On `401`, clear local auth state and return to login.
7. On `403` `Missing or invalid CSRF token`, re-read the CSRF cookie/login response and retry the mutation. On `403` CORS, fix the origin/deployment configuration; retrying will not help.
8. On `409` fulfillment conflicts, reload the order before offering another transition.

## 12. Status and enum reference

### Order `status`
- `PENDING` — created, not confirmed by payment.
- `CONFIRMED` — payment verified.
- `CANCELLED` — cancelled by admin while unpaid.

### Order `paymentStatus`
- `UNPAID`
- `PAID`
- `REFUNDED` — enum exists, but **no endpoint currently sets it**.

### Order `fulfillmentStatus`
- `UNFULFILLED`
- `PROCESSING`
- `FULFILLED`
- `CANCELLED`

Valid admin path: `UNFULFILLED → PROCESSING → FULFILLED`, or `UNFULFILLED/PROCESSING → CANCELLED` while unpaid. Direct `UNFULFILLED → FULFILLED` is rejected.

### Payment attempt `status`
- `PENDING`
- `SUCCESS`
- `FAILED`
- `ABANDONED`

### Reservation `status` (server-side)
- `ACTIVE`
- `CONSUMED`
- `RELEASED`
- `EXPIRED`

Frontends mainly see `ACTIVE` on checkout creation and `FULFILLED`/`CANCELLED` reservations in admin detail.

### Status-history `field`
- `ORDER`
- `PAYMENT`
- `FULFILLMENT`

## 13. Known gaps and unverified behavior

These are important for planning; do not assume endpoints or fields that are not listed above.

- **No admin product list/detail endpoint.** There is no `GET /admin/products` and no `GET /admin/products/:id`. Public product endpoints only expose active products, so there is no API to browse inactive products in the admin UI.
- **No admin category list/detail endpoint.** Admin category reads must use the public category endpoints.
- **No refund workflow.** `REFUNDED` exists in the schema/enum, but no endpoint transitions an order or payment to it. Paid orders also cannot be cancelled through fulfillment.
- **No customer accounts, order history, or customer cancellation.** The only customer order access is public lookup by unguessable reference, with a limited field set.
- **No shipping-method or tax selection.** Delivery is a flat server-configured fee.
- **No payment retry/reuse endpoint.** Each initialize creates a new payment attempt.
- **No order-email verification or token.** Anyone with an order reference can read the limited public order view.
- **No dedicated image delete/reorder endpoint.** `PUT /admin/products/:id` with `images` replaces all image rows destructively.
- **Idempotent checkout duplicate response omits reservations.** Simultaneous same-key checkout requests may surface a database unique-constraint error rather than a clean idempotent response.
- **Bootstrap applies weaker validation than login.** It only checks field presence, while login requires a valid email and a password of at least 8 characters.
- **Unique-constraint errors for duplicate category/product name/slug are not explicitly mapped** in the visible controllers/services. They may surface as generic `500` responses rather than `409`.
- **Deleting a category referenced by products is not explicitly guarded.** The database foreign key may reject it; the visible error mapping may return a generic `500`.
- **Production CORS allowlist, production frontend URL, actual delivery fee, and reservation duration** are environment-dependent and cannot be verified from the repository. The repository defaults are `http://localhost:5173`, `150000` kobo, and 15 minutes respectively.
- **Signed image URLs expire in 1 hour.** Any UI that keeps image URLs longer must refresh product data or handle broken images.
- **Logout does not revoke JWTs.** Stateless tokens remain valid until 24-hour expiry.
- **The `error` field is not a stable machine-readable code** for non-validation errors. Use HTTP status and documented messages.

## 14. Endpoint summary

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/v1/health` | No | Liveness |
| GET | `/api/v1/health/ready` | No | Database readiness |
| GET | `/api/v1/categories` | No | List categories |
| GET | `/api/v1/categories/:slug` | No | Category with active products |
| GET | `/api/v1/products` | No | Paginated active products |
| GET | `/api/v1/products/:slug` | No | Active product detail |
| POST | `/api/v1/checkout` | No | Create order (rate limited) |
| GET | `/api/v1/checkout/:reference` | No | Limited public order lookup |
| POST | `/api/v1/payments/initialize` | No | Start Paystack payment |
| GET | `/api/v1/payments/verify/:reference` | No | Verify payment and finalize order |
| POST | `/api/v1/payments/webhook` | Paystack signature | Paystack webhook |
| POST | `/api/v1/admin/bootstrap` | No | Create first admin |
| POST | `/api/v1/admin/login` | No | Admin login |
| POST | `/api/v1/admin/logout` | Public/idempotent | Clear auth cookies |
| GET | `/api/v1/admin/me` | Admin | Current admin |
| POST | `/api/v1/admin/categories` | Admin | Create category |
| PUT | `/api/v1/admin/categories/:id` | Admin | Update category |
| DELETE | `/api/v1/admin/categories/:id` | Admin | Delete category |
| POST | `/api/v1/admin/products` | Admin | Create product |
| PUT | `/api/v1/admin/products/:id` | Admin | Update product |
| POST | `/api/v1/admin/products/:productId/image` | Admin | Upload/replace product image |
| PATCH | `/api/v1/admin/products/:id/activate` | Admin | Activate product |
| PATCH | `/api/v1/admin/products/:id/deactivate` | Admin | Deactivate product |
| GET | `/api/v1/admin/orders` | Admin | Paginated/filterable orders |
| GET | `/api/v1/admin/orders/:reference` | Admin | Order detail |
| PATCH | `/api/v1/admin/orders/:reference/fulfillment` | Admin | Fulfillment transition |

Rate limits (per IP):

| Scope | Limit |
| --- | --- |
| Global `/api/v1` | 300 / 15 min; skips health and payment webhook |
| Admin login | 5 / 15 min |
| Admin bootstrap | 5 / hour |
| Checkout | 30 / 15 min |
| Payment initialize/verify | 60 / 15 min |
