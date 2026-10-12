# DDCS MVC Refactor (staged)

This branch reorganizes the existing app without changing its public URLs, data model fields, product copy, form targets, payment endpoints, visual theme, or deployment entry points.

## Frontend (React / Vite)
- `client/src/main.jsx`: application bootstrap only.
- `client/src/models/storeModel.js`: cart persistence and currency formatting model helpers.
- `client/src/controllers/storeController.js`: centralized API communication controller; retains the existing `/api` URL contract.
- `client/src/views/StoreView.jsx`: existing storefront view and its UI interactions, moved without intentional visual/content changes.
- `client/src/views/ErrorBoundary.jsx`: UI error boundary.
- `client/src/styles.css`: existing theme stylesheet retained as-is.

## Backend (Node.js / Express / MongoDB)
- `server.js`: existing Node server entry point retained.
- `api/index.js`: Express application setup and middleware only.
- `api/models/index.js`: existing Mongoose schemas and models.
- `api/routes/apiRoutes.js`: API route registration layer.
- `api/controllers/apiController.js`: existing endpoint handlers.
- `api/middleware/auth.js`: JWT authentication and admin authorization middleware.
- `api/services/database.js`: MongoDB connection service.
- `api/services/catalogSeed.js`: existing initial catalog seeding logic.
- `api/services/emailService.js`: existing email adapter.

## Release safety
This is a feature branch, not `main`. Do not merge or deploy until build, API, checkout, forms, authentication, mobile layout, and existing navigation are tested. No production deployment is initiated by this refactor.
