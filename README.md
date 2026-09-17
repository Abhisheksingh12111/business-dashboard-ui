# BusinessFlow Dashboard

A responsive business management dashboard built with Next.js and Supabase. It includes Overview, Bookings, Customers, Leads, Services, Payments, Reports, and Settings modules.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Add the Supabase values and a long random integration API key.
3. Install dependencies and start the app:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Vercel environment variables

Add these variables in Project Settings → Environment Variables and redeploy:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
DASHBOARD_INGEST_API_KEY
```

`SUPABASE_SERVICE_ROLE_KEY` and `DASHBOARD_INGEST_API_KEY` are server-only secrets. Never prefix them with `NEXT_PUBLIC_` or put them in website browser code.

## Automation API

The integration endpoints accept server-to-server `POST` requests. Send the shared secret using `Authorization: Bearer <DASHBOARD_INGEST_API_KEY>` or the `x-api-key` header.

### Add a website lead

```bash
curl -X POST https://your-dashboard.vercel.app/api/integrations/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SECRET" \
  -d '{
    "name": "Aarav Sharma",
    "phone": "+91 98765 43210",
    "email": "aarav@example.com",
    "source": "Website",
    "interest": "Premium package",
    "notes": "Requested a callback"
  }'
```

### Add a website booking

```bash
curl -X POST https://your-dashboard.vercel.app/api/integrations/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SECRET" \
  -d '{
    "customer_name": "Aarav Sharma",
    "phone": "+91 98765 43210",
    "email": "aarav@example.com",
    "service": "Consultation",
    "booking_date": "2026-09-20",
    "booking_time": "15:30",
    "source": "Website"
  }'
```

A booking also creates a Customer record when no matching email or phone exists.

### Add a successful online payment

```bash
curl -X POST https://your-dashboard.vercel.app/api/integrations/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SECRET" \
  -d '{
    "customer_name": "Aarav Sharma",
    "service": "Consultation",
    "amount": 2500,
    "payment_method": "Razorpay",
    "status": "Paid",
    "reference": "pay_example123"
  }'
```

The payment endpoint is designed to be called by the verified success handler or webhook adapter of the selected payment provider. Provider signature verification must happen before forwarding the normalized payment data to this endpoint.

## Checks

```bash
npm run lint
npm run build
```
