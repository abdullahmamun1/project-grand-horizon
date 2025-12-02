# Hotel Booking System Design Guidelines

## Design Approach

**Reference-Based Approach**: Drawing inspiration from leading hospitality platforms (Airbnb, Booking.com, Marriott) to create a trustworthy, visually appealing booking experience that balances elegance with functionality.

**Core Design Principles**:
- Visual trust through generous imagery and clean layouts
- Intuitive booking flow with clear status indicators
- Professional dashboard interfaces for admin/manager roles
- Consistent spacing and hierarchy across all pages

---

## Typography

**Font Stack**: 
- Primary: Inter or DM Sans (headers, UI elements)
- Secondary: System font stack for body text

**Hierarchy**:
- H1: 3xl to 5xl (Hero headlines)
- H2: 2xl to 3xl (Section headers)
- H3: xl to 2xl (Card titles, subsection headers)
- Body: base to lg (descriptions, content)
- Small: sm to xs (captions, meta info)

**Weights**: Regular (400), Medium (500), Semibold (600), Bold (700)

---

## Layout System

**Spacing Units**: Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Component padding: p-4 to p-8
- Section spacing: py-12 to py-24
- Card gaps: gap-4 to gap-6
- Grid gaps: gap-6 to gap-8

**Container Widths**:
- Full-width sections: w-full with max-w-7xl mx-auto
- Content sections: max-w-6xl
- Forms/dashboards: max-w-4xl

**Grid System**:
- Room cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Dashboard stats: grid-cols-2 lg:grid-cols-4
- Admin tables: Full-width responsive tables

---

## Component Library

### Navigation
- Sticky header with logo (left), navigation links (center), user menu (right)
- Mobile: Hamburger menu with slide-out drawer
- Include CTA button: "Book Now" or user avatar with dropdown
- Height: h-16 to h-20

### Hero Section
- **Large hero banner** (h-[500px] to h-[600px])
- Background image with overlay for text readability
- Centered content: Hotel name/logo, tagline, search bar
- Search bar with date pickers, guest selector, search button
- Buttons on image: Use backdrop-blur-sm with semi-transparent backgrounds
- Responsive: h-[400px] on mobile, full height on desktop

### Room Cards
- Image carousel (3-5 images per room)
- Room type badge, price prominently displayed
- Amenities icons (WiFi, AC, TV, etc.) in grid
- "View Details" button
- Hover: Subtle lift effect (shadow increase)

### Room Detail Page
- Large image gallery (masonry or carousel layout)
- Two-column layout: Images (60%), booking panel (40%)
- Sticky booking panel on desktop
- Amenities grid with icons
- Reviews section with star ratings and customer photos
- "Book Now" sticky footer on mobile

### Booking Flow
- Multi-step indicator (Select Dates → Review → Payment → Confirmation)
- Booking summary card always visible
- Form sections with clear labels and validation
- Status badges for booking states:
  - Pending: Soft yellow/amber
  - Confirmed: Green
  - Checked-In: Blue
  - Checked-Out: Gray
  - Cancelled: Red

### Dashboards (Admin/Manager)
- Sidebar navigation (200px to 240px width)
- Main content area with stats cards at top
- Data tables with sorting, filtering, pagination
- Action buttons (Edit, Delete, Update Status) in table rows
- Modal overlays for forms and confirmations

### Forms
- Admin room management: Multi-column layout on desktop
- Amenities: Dropdown with checkboxes, "Other" option reveals text input
- Image upload: Drag-and-drop area with preview thumbnails
- Consistent input styling with focus states
- Floating labels or top-aligned labels

### Buttons
- Primary: Large, rounded corners (rounded-lg)
- Secondary: Outline style
- Icon buttons for actions
- Loading states with spinners
- All buttons implement hover/active states

### Cards
- Rounded corners (rounded-xl)
- Subtle shadows (shadow-sm to shadow-lg)
- Padding: p-6 to p-8
- Hover states for interactive cards

---

## Images

**Hero Section**:
- Large, high-quality hotel exterior or luxury room image
- Professional photography with warm, inviting tones
- Image should convey comfort and hospitality

**Room Galleries**:
- Multiple angles: bed, bathroom, amenities, view
- Consistent aspect ratio (4:3 or 16:9)
- High resolution with proper compression

**Placeholder Images**:
- Use reputable placeholder services for development
- Descriptive alt text for accessibility

---

## Page Layouts

### Landing/Home Page
1. **Large Hero** with search functionality
2. Featured Rooms (3-column grid)
3. Amenities/Services section with icons
4. Testimonials/Reviews (carousel or grid)
5. Call-to-action section
6. Footer with links, contact info, newsletter signup

### Room Listing Page
- Filters sidebar (desktop) or drawer (mobile)
- Grid of room cards
- Pagination or infinite scroll
- Sort options (price, rating, availability)

### Customer Dashboard
- Welcome section with user info
- Tabs: Active Bookings, Past Bookings, Reviews
- Booking cards with status, dates, actions
- Empty states with helpful messages

### Admin/Manager Panel
- Sidebar with navigation sections
- Dashboard: Stats cards + recent bookings table
- Rooms page: Add button, searchable table
- Bookings page: Filterable table with status updates
- Room form: Grid layout with image upload area

---

## Accessibility & Interactions

- Focus indicators on all interactive elements
- ARIA labels for icons and actions
- Keyboard navigation support
- Form validation with clear error messages
- Toast notifications for actions (top-right position)
- Loading states for async operations
- Disabled states clearly differentiated

---

## Responsive Behavior

**Breakpoints**:
- Mobile: < 768px (single column, stacked layouts)
- Tablet: 768px - 1024px (2-column grids)
- Desktop: > 1024px (3+ column grids, sidebars visible)

**Mobile Optimizations**:
- Sticky booking panel becomes fixed footer
- Navigation collapses to hamburger
- Tables switch to card-based lists
- Filters move to bottom sheet/drawer
- Touch-friendly button sizes (min h-12)