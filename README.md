# Techno Industries — B2B E-commerce Platform

A Next.js 15 (App Router) storefront + back office for a wholesale/industrial goods business. Customers browse products, order with OTP login, and pay via Razorpay; admins manage catalog, orders and delivery pricing; partner vendors ship their own order items. Ships as a PWA / Android TWA.

## Stack

- **Next.js 15.4** (App Router, React 19, Server Actions), TypeScript
- **Prisma 6 + PostgreSQL** (client generated into `app/generated/prisma`)
- **NextAuth v5** (JWT sessions) for customers and partners
- **Tailwind CSS 4 + Radix UI / shadcn-style components** (`components/ui`)
- **Razorpay** payments, **web-push/VAPID** notifications, **WhatsApp Cloud API**
- `zustand` (cart store), `@tanstack/react-table`, `zod`, `papaparse` (pincode CSV import)

## Layout

```
app/
  (customerside)/   storefront: home, products, cart, checkout, orders, refund, profile
  admin/            admin dashboard (products, categories, orders, customers,
                    delivery-settings, notifications, CSV/JSON export)
  partner/          vendor portal (login via NextAuth, sees own products/orders)
  api/              route handlers: auth, razorpay (order/verify), OTP, catalog,
                    checkout, orders, push-token, delivery settings, pincodes
lib/                prisma client, server actions per domain, auth helpers, cart store
prisma/             schema, migrations, seeds (incl. pincode seeder)
middleware.ts       HTTP Basic auth for /admin, NextAuth guard for /partner
auth.ts             NextAuth config: customer OTP + partner credentials providers
scripts/            DB backup utility (npm run backup)
```

## Domain model (see `prisma/schema.prisma`)

`Category → Product → OrderItem ← Order ← Customer`, plus `Partner` (vendor, referenced by `Product.partnerId`) and delivery pricing models: `DeliverySettings` (global), `StateDelivery`, `PincodeDelivery` (per-pincode overrides, `isDelivery` flag). `PushSubscription` stores web-push endpoints.

## Auth & access

- **Customers**: phone + OTP (`send-otp` / `verify-otp`, stored in `lib/otpstore.ts`). Test bypass: `9019997375` / `123456`.
- **Partners**: username + bcrypt password; `/partner/*` guarded in middleware for `role === 'partner'`.
- **Admin**: HTTP Basic auth using `ADMIN_USERNAME` + `HASHED_ADMIN_PASSWORD` (base64 SHA-512), checked in `middleware.ts`.

## Running locally

```bash
npm install
npx prisma generate           # outputs client to app/generated/prisma
npx prisma migrate deploy     # or: npx prisma migrate dev
npm run dev                   # http://localhost:3000
```

Optional: `node prisma/seed.js` (or `prisma/seed-pincodes.ts`) for sample data.

## Environment variables (`.env`)

Required: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `BASEURL`, `NEXT_PUBLIC_BASEURL`,
`ADMIN_USERNAME`, `HASHED_ADMIN_PASSWORD`,
`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `NEXT_PUBLIC_RAZORKEY`,
`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
`WHATSAPPENV` (Cloud API token), `WHATSAPPPHONE` (phone number ID),
and `GITHUB_TOKEN` / `GITHUB_OWNER` / `GITHUB_REPO` for image hosting.

Admin password hash: `echo -n '<password>' | openssl dgst -sha512 -binary | base64`.

## Notes

- Server Actions in `app/admin/actions/*` and `lib/*-actions.ts` are the main mutation layer; `app/api/app/*` mirrors some of them for the mobile/TWA client.
- Payments: `/api/razorpay/order` creates the order, `/api/razorpay/verify` confirms signature and marks the order paid.
- Deploy target is a Node server (Coolify); `next.config.ts` whitelists GitHub/jsDelivr image hosts.
