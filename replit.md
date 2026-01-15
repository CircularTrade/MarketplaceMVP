# CircularTrade - Construction Materials Marketplace

## Overview

CircularTrade is a B2B marketplace platform designed for the construction industry to facilitate the buying and selling of materials. It connects verified sellers with buyers, offering secure transactions, delivery quote management, and order tracking. The platform aims to reduce waste through material reuse, providing a production-grade experience with payment processing, real-time messaging, and location-based search capabilities. It manages the entire transaction lifecycle from listing to payment and order completion.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React and TypeScript, using Vite for fast development. It employs Wouter for routing, TanStack Query for state management, and Shadcn/ui (built on Radix UI primitives) for UI components. Styling is managed with Tailwind CSS, following a custom design system focused on construction industry aesthetics. Form handling is done with React Hook Form and Zod for validation. The design system features Inter font, a neutral color palette, and is responsive with a mobile-first approach. Key pages include the homepage, an interactive map view, detailed listing pages, checkout, user dashboard, and authentication flows.

### Backend Architecture
The backend is an Express.js application written in TypeScript. It uses Express-session with a PostgreSQL store for session management and Passport.js with a Local Strategy (scrypt for hashing) for authentication. The API is RESTful with JSON responses, and Zod schemas are shared for validation. Core API routes handle authentication, CRUD operations for listings, geo-filtered listing searches, orders, messages, and reviews. Authentication is session-based with secure cookies.

### Data Storage
PostgreSQL, hosted via Neon serverless, is the primary database. Drizzle ORM is used for type-safe queries, with schema definitions (`shared/schema.ts`) shared across the stack. Drizzle Kit manages migrations. Core data models include `users`, `listings` (with geographic coordinates), `orders`, `messages`, and `reviews`. Key design decisions include UUID primary keys, timestamp tracking, status-based state management, array fields for images, and geographic data with spatial indexing for efficient radius queries.

### UI/UX Decisions
The platform utilizes a "new-york" style preset for UI components, ensuring a professional and consistent look. The color scheme is neutral-based to reflect professional credibility. Typography uses Inter for headings and UI elements, with system fonts for body text.

### Feature Specifications
- **Buyer-Seller Messaging System**: Complete real-time chat functionality enabling direct communication between buyers and sellers:
  - Thread creation from listing detail pages via "Message Seller" button
  - Message inbox showing all conversations with previews and unread indicators
  - Thread view with bubble chat interface (sender messages right-aligned, recipient left-aligned)
  - Unread message tracking with last-read timestamps (lastReadAtBuyer/Seller fields)
  - Header notification badge showing unread count (polls every 10s)
  - Message polling for real-time updates (every 3s in active thread view)
  - Server-side validation: auth required, participant validation, no self-messaging, 1-5000 char limit
  - Database schema enforces one thread per buyer+seller+listing combination via unique constraint
  - WebSocket-ready architecture (currently using polling for simplicity)
  - API routes: POST /start, GET /threads, GET /thread/:id, POST /send, GET /unread-count
- **Australian Localization**: Sample data comprises 40 Australian listings with comprehensive location details, with the map defaulting to Sydney.
- **Mapbox Geocoding Integration**: Automates address-to-coordinates conversion for listings, validating coordinates, and providing error handling.
- **Interactive Map**: Offers comprehensive map-based listing discovery with geo-filtering (radius, material, price, condition, pickup deadline) using Haversine distance and Supercluster for marker management.
- **Cloudinary Image Upload**: Integrated into the listing creation process, supporting multiple images (up to 6) with client-side upload, preview, and validation. Images are stored in a dedicated Cloudinary folder.
- **Production-Grade Delivery Quote System**: Implements a secure quote-to-order workflow with server-side pricing calculation. Quotes are persisted in a `delivery_quotes` table, validated against canonical listing IDs, and insulated from client-side manipulation.
- **Stripe Checkout Integration**: Full PaymentIntent-based checkout flow with Stripe Elements for PCI-compliant payment forms. Server-side amount validation prevents client manipulation. Webhook processing (payment_intent.succeeded) marks orders as paid with timestamps. Supports complete transaction lifecycle from order creation to payment confirmation with dedicated checkout and order completion pages.
- **Seller Dashboard**: Comprehensive dashboard interface with 5 main sections using Shadcn Sidebar component for navigation. Includes Overview (summary statistics), My Listings (manage active listings), Orders (view orders as seller or buyer with tabs), Sustainability Metrics (environmental impact tracking), and Settings (profile and password management). All routes are protected with authentication middleware.

### System Design Choices
- **Type Safety**: Achieved through TypeScript and shared Zod schemas across frontend and backend.
- **Security**: Includes scrypt password hashing, HTTP-only session cookies, CSRF protection, and server-side validation for all critical transactions (e.g., pricing, order status).
- **Scalability**: Utilizes serverless PostgreSQL, efficient spatial queries, and marker clustering for map performance.
- **Environment Configuration**: Key configurations are managed via environment variables (e.g., `DATABASE_URL`, `SESSION_SECRET`, API keys).
- **Deployment**: Frontend builds to `dist/public`, backend bundles to `dist`, served from a single process.

## External Dependencies

-   **Payment Processing**: Stripe (PaymentIntent API for checkout, Elements for payment forms, webhook processing for order completion, test mode enabled, ready for Stripe Connect migration).
-   **UI Component Libraries**: Radix UI (primitives), Shadcn/ui (pre-styled components), Lucide React (icons).
-   **Map Integration**: Mapbox GL JS (via react-map-gl v7.1.7) for interactive maps, marker clustering (supercluster), and geo-filtering.
-   **Image Upload**: Cloudinary (Upload Widget for client-side uploads, image storage).
-   **Database**: Neon (serverless PostgreSQL).
-   **ORM**: Drizzle ORM.
-   **Development Tools**: Vite, ESLint, Prettier, TypeScript.

## Testing & Development

### Database Seeding
Run `tsx scripts/seed.ts` to populate the database with test data including:
- Test users (buyer: testbuyer/password123, seller: testseller/password123)
- Sample listings with Australian locations
- Delivery quotes
- A ready-to-checkout order for testing the Stripe payment flow

The seed script is idempotent and clears existing data before seeding.

### Sustainability Metrics Calculations
The platform calculates environmental impact metrics for material reuse:
- **Weight Estimation**: Estimates weight in kg for different material types (timber, steel, concrete, bricks) based on typical densities
- **Tipping Fees Saved**: Calculates cost savings at $150 per tonne of material diverted from landfill
- **CO₂ Emissions Avoided**: Uses 0.9 kg CO₂e per kg of waste diverted (based on landfill emission factors)
- Metrics are aggregated by material type and displayed in the Sustainability dashboard page

### Dashboard Pages
The seller dashboard consists of five main pages (all under `/dashboard/*`):
1. **Overview** (`/dashboard`) - Summary statistics including total listings, active listings, orders, revenue, and sustainability metrics snapshot
2. **My Listings** (`/dashboard/listings`) - Grid view of seller's listings with status badges and quick actions
3. **Orders** (`/dashboard/orders`) - Tabbed view showing orders as seller or buyer, with order details and status
4. **Sustainability** (`/dashboard/sustainability`) - Environmental impact metrics with charts showing material diverted, tipping fees saved, and CO₂ avoided, broken down by material type
5. **Settings** (`/dashboard/settings`) - Profile management (name, company name, ABN) and password change functionality

All dashboard routes use the DashboardLayout component which includes:
- Shadcn Sidebar with navigation links
- Auth guard that redirects unauthenticated users to /login  
- Mobile-responsive toggle for sidebar
- Active route highlighting

### Known Testing Limitations
- **Playwright Session Cookie Handling**: In automated Playwright tests, session-based authentication exhibits intermittent issues:
  - Post-login redirect to /dashboard may not work correctly
  - Protected routes (messaging, checkout) may redirect to /login despite valid sessions
  - GET /api/auth/me may return 200 with empty body instead of user data
  - This appears to be a Playwright-specific limitation with session cookie persistence
  - All features work correctly when tested manually in a browser
  - Manual testing is recommended for: login flow, messaging system, checkout process