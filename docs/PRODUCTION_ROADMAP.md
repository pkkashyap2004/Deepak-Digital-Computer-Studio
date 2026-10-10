# Deepak Digital Computer Studio — Production Roadmap

## Current repository baseline
- React + Vite storefront in `client/`
- Express API handler in `api/index.js`
- MongoDB/Mongoose product, user, order and coupon models
- JWT registration/login, basic product listing, cart UI, order creation
- Razorpay adapter and Resend email adapter are starter integrations
- Vercel project linked to this repository

## Release gates — do not label production-ready until verified
1. **Foundation:** confirm clean install/build, fix local server entry point, environment validation, structured errors, request IDs, rate limits and secure CORS.
2. **Identity:** access/refresh token lifecycle, password reset/email verification, role management, admin bootstrap, account profile and address CRUD.
3. **Catalog:** product details, category/filter/sort/pagination, variants/SKUs, image storage, inventory transactions, seller ownership and validation.
4. **Shopping:** persistent user carts, guest-cart merge, wishlist, server-calculated prices, coupon rules and shipping/tax totals.
5. **Orders & payments:** never trust client totals; create order and payment intent server-side; verify Razorpay signature/webhook; idempotency; reserve/release stock; refunds; COD rules; order status history.
6. **Marketplace:** seller onboarding/KYC workflow, seller-scoped inventory/orders, commissions/payout reconciliation, admin moderation and audit logs.
7. **Customer experience:** reviews verified against purchases, returns/refunds, notifications, search SEO metadata, accessibility and responsive UI.
8. **Support:** authenticated chat, Socket.IO presence, WebRTC 1:1 voice/video signaling, call consent and abuse/report controls.
9. **Live commerce:** scheduled streams, SFU/managed media provider, product pinning, moderated chat, purchase events, recording retention and stream analytics.
10. **Quality & operations:** unit/integration/E2E tests, dependency and secret scans, backups/restore drill, monitoring, alerting, privacy policy, terms, shipping/returns policies.
11. **Production release:** configure MongoDB Atlas network/user access and all environment variables in Vercel; verify health, checkout sandbox, webhook, email and mobile behavior before enabling live payments.

## Required Vercel environment variables
- `MONGODB_URI` (required)
- `JWT_SECRET` (required, strong random value)
- `CLIENT_URL` (production site origin)
- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` (only when enabling Razorpay)
- `RESEND_API_KEY` and `FROM_EMAIL` (only when enabling transactional email)

Do not commit production secrets or put them in client-side Vite variables. Set secrets directly in Vercel Project Settings → Environment Variables.

## Local run
1. Install Node.js LTS and MongoDB Atlas/local MongoDB.
2. Copy `.env.example` to `.env` and fill in a valid database URI and random JWT secret.
3. Run `npm install` and `npm --prefix client install`.
4. Run `npm run dev`; open the Vite URL printed in the terminal.
5. Check `/api/health` after the API starts.

## Known limitations to resolve before production
- Current checkout is a starter flow and must not be treated as a completed payment workflow.
- Current payment endpoint may return a demo order when Razorpay credentials are absent. Demo mode must never be presented as a real payment.
- The API currently permits guest order creation and uses a minimal user model; add ownership, validation, and abuse controls before public launch.
- Live video/voice and live-commerce functionality are not implemented by this baseline.
- Figma page outlines are documentation, not an actual editable Figma design file.
