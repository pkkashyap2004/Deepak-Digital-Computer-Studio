# Deepak Digital Computer Studio — MERN Commerce

A production-oriented e-commerce foundation for Deepak Digital Computer Studio using MongoDB, Express, React and Node.js.

## Included
- Existing responsive storefront and full-site search across pages, sections, product names, categories, descriptions and offers
- Product category filters, sorting and animated card/section interactions
- MongoDB product/order models and catalog seed data
- Cart and PayPal hosted checkout flow
- JWT password authentication and optional email OTP authentication
- Resend transactional email adapter
- Site visit counter and recorded product rating/review summary endpoints
- Vercel-ready React + Express deployment
- Backend MVC-style separation into models, controllers, routes, middleware and services

## Email OTP setup
Configure these environment variables in the deployment environment:
- `MONGODB_URI`: MongoDB Atlas connection string
- `JWT_SECRET`: a long random secret used to sign sessions
- `OTP_SECRET`: a separate long random secret used to hash OTP codes
- `RESEND_API_KEY`: API key from Resend
- `FROM_EMAIL`: sender address allowed by your Resend account
- `CONTACT_EMAIL`: optional destination for contact form notifications

The email OTP expires after 10 minutes, allows at most five verification attempts, enforces a 60-second resend cooldown and limits requests to five per email per hour. OTP hashes and throttle data are stored in MongoDB, with expired records removed using a TTL index.

Resend currently advertises a free transactional tier with up to 3,000 emails per month and 100 per day. The provider can change its limits. For sending to real customers, verify a sender domain in Resend and set `FROM_EMAIL` to that verified address. The `onboarding@resend.dev` value is intended for testing and may be restricted to verified test recipients. Never commit API keys.

## Deployment and verification
The website's existing frontend entry point, `server.js`, `api/index.js` entry point, Vercel rewrites and current UI theme are preserved. This feature branch must pass the frontend production build and functional checks for search, catalogue visibility, mobile navigation, OTP, existing login, contact forms and checkout before it is merged or deployed.

Build with `npm run build`; the React output is `client/dist`.

Never commit real API keys or database credentials.
