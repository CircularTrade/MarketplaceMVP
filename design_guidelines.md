# CircularTrade Design Guidelines

## Design Approach

**Reference-Based:** Drawing from established marketplace patterns (Airbnb, Etsy, eBay) with professional construction industry aesthetics. Focus on trust-building through clean layouts, clear information hierarchy, and strong visual presentation of materials.

**Core Principles:**
- Professional credibility for B2B construction context
- Visual emphasis on material quality and authenticity
- Efficient transaction flows with transparent pricing
- Trust signals throughout (seller ratings, secure payments, clear timelines)

## Typography

**Font Families:**
- Primary: Inter (headings, UI elements, data)
- Secondary: System fonts for body text (optimal readability)

**Hierarchy:**
- Hero/Page Titles: text-4xl to text-5xl, font-bold
- Section Headers: text-2xl to text-3xl, font-semibold
- Card Titles/Listings: text-lg to text-xl, font-semibold
- Body Text: text-base, font-normal
- Metadata/Labels: text-sm, font-medium
- Small Print/Helper Text: text-xs

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 20
- Component padding: p-4, p-6, p-8
- Section spacing: py-12, py-16, py-20
- Card gaps: gap-4, gap-6, gap-8
- Margins: mb-2, mb-4, mb-6, mb-8

**Container Widths:**
- Full-width sections: max-w-7xl mx-auto
- Content sections: max-w-6xl mx-auto
- Forms: max-w-2xl
- Narrow content: max-w-xl

## Page-Specific Layouts

### Feed/Homepage
- **Hero Section (60vh):** Large background image of construction materials/site with overlay, centered search bar with filters (material type, location radius, pickup deadline), trust indicators ("500+ verified sellers")
- **Filter Bar:** Sticky horizontal filter chips below hero - material categories, distance slider, date range picker
- **Listing Grid:** 3-column grid (lg), 2-column (md), 1-column (mobile) - each card shows primary image, title, price (bold, text-2xl), location, pickup deadline (countdown badge), condition tag, seller rating
- **Card Design:** Rounded corners (rounded-lg), subtle shadow (shadow-md), hover lift effect (transform scale), image aspect-ratio 4:3

### Listing Detail
- **Image Section:** Full-width carousel with thumbnails below, 5-6 product photos minimum, zoom capability
- **Two-Column Layout (desktop):** Left: images (60%), Right: sticky info panel (40%)
- **Info Panel Components:**
  - Title (text-3xl font-bold)
  - Price (text-4xl font-bold) + quantity available
  - Key specs grid: Material type, dimensions, condition, weight
  - Pickup deadline with countdown timer (highlighted badge)
  - Seller card: avatar, name, rating stars, verified badge, "Member since" date
  - "Get Delivery Quote" CTA button (primary, large)
  - Secondary "Contact Seller" button
- **Below Fold:** Full-width tabbed sections - Description, Specifications (table format), Location map, Reviews

### Delivery Quote Modal/Section
- **Form:** Buyer's suburb/postcode with Mapbox autocomplete, payload size dropdown
- **Results Display:** 3 quote cards side-by-side, each showing: Provider name/logo placeholder, vehicle type icon, price breakdown (base + per km), ETA window, "Select" button
- **Selection Highlight:** Selected quote gets border accent and checkmark

### Checkout Page
- **Two-Column Layout:** Left: Order summary card (listing image thumbnail, title, quantity, price), Delivery details card (selected quote, distance, ETA), Right: Payment breakdown (item subtotal, delivery fee, marketplace fee 8%, total) + Stripe payment form
- **Progress Indicator:** 3-step breadcrumb at top (Cart → Payment → Confirmation)
- **Trust Elements:** Secure checkout badges, Stripe logo, money-back guarantee notice

### Dashboard
- **Tabbed Interface:** "My Listings" / "My Orders" / "Payout Settings" tabs
- **For Sellers:**
  - Listings table: thumbnail, title, price, views, status (active/sold), actions (edit/delete)
  - If no Stripe connected: Alert banner "Connect Payouts to receive payments" with CTA
  - Stripe Connect: Account status card with earnings summary
- **For Buyers:**
  - Orders list: thumbnail, title, status badge (PAID/IN_TRANSIT/COMPLETED), delivery date, action buttons (Track, Message Seller, Leave Review)
- **Card-Based on Mobile, Table on Desktop**

### Admin Page
- **Simple Data Table:** Flagged listings with columns: thumbnail, title, reporter, reason, date, actions (review/remove)
- **Filter Tabs:** All / Pending / Resolved

## Component Library

### Navigation
- **Header:** Full-width, white background, shadow-sm, height h-16
- **Logo:** Left-aligned, medium size
- **Nav Links:** Center-aligned (desktop), hidden in mobile menu
- **Right Actions:** "Post Listing" (primary button), user avatar dropdown, notifications bell icon

### Cards
- **Listing Card:** rounded-lg, shadow-md hover:shadow-xl transition, overflow-hidden
  - Image top (aspect-ratio 4:3, object-cover)
  - Content padding p-4
  - Price emphasized (text-xl font-bold)
  - Metadata row (location, deadline) text-sm with icons
  - Condition badge (absolute top-right on image)

### Buttons
- **Primary CTA:** Solid background, rounded-lg, px-6 py-3, font-semibold, hover lift
- **Secondary:** Outline style, same dimensions
- **Icon Buttons:** Square (w-10 h-10), rounded-full for avatars/close buttons

### Forms
- **Input Fields:** border-2, rounded-lg, p-3, focus:ring effect
- **Labels:** text-sm font-medium mb-2
- **Helper Text:** text-xs below inputs
- **File Upload:** Drag-and-drop zone with dashed border, preview grid below
- **Map Autocomplete:** Dropdown with location icon, suggestions list

### Badges/Tags
- **Status:** Small rounded-full pills with dot indicator
- **Countdown Timers:** Prominent with clock icon, urgent states get warning styling
- **Ratings:** Yellow stars with numerical score

### Messaging
- **Thread View:** Split layout - conversation list left (30%), message thread right (70%)
- **Messages:** Chat bubble design, buyer vs seller differentiated
- **Composer:** Fixed bottom input bar with attachment option

## Images

**Hero Section:**
- Large, professional photograph of construction materials (steel beams, recycled timber, concrete blocks) at a well-organized yard or active construction site
- Image should convey quality, organization, and industrial scale
- Subtle dark overlay (opacity-40) for text readability

**Listing Cards:**
- Primary product photo showing material clearly
- Professional quality, well-lit, plain or contextual background
- Multiple angles in carousel (detail shots, scale reference, condition evidence)

**Trust Building:**
- Seller avatar/profile photos (authentic, professional)
- Verification badge icons throughout
- Payment security logos (Stripe, SSL)

## Key UX Patterns

- **Trust Signals Everywhere:** Verified badges, ratings, secure payment icons, member since dates
- **Transparent Pricing:** Always show breakdown (item + delivery + fee = total)
- **Clear CTAs:** Every page has obvious next action (Get Quote → Select → Checkout → Pay)
- **Status Visibility:** Order tracking with clear states and expected timelines
- **Mobile-First Forms:** Single column, large touch targets, autocomplete friendly
- **Progressive Disclosure:** Show essential info first, additional details in tabs/accordions
- **Minimal Animations:** Subtle hover lifts on cards, smooth transitions between states, no distracting effects