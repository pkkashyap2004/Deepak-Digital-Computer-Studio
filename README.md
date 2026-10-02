# Deepak Digital Computer Studio — MERN Commerce

A production-oriented e-commerce foundation for Deepak Digital Computer Studio using MongoDB, Express, React and Node.js.

## Included
- Responsive storefront and product search
- MongoDB product/order models and demo seed data
- Cart and checkout flow
- Razorpay payment adapter with safe demo fallback when credentials are absent
- Resend transactional email automation adapter
- JWT authentication endpoints
- Vercel-ready React + Express structure
- Environment-variable based secrets

## Deployment
Configure MongoDB Atlas and payment/email environment variables in the deployment environment. Build with `npm run build`; the React output is `client/dist`.

Never commit real API keys or database credentials.