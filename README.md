# Grand Horizon Hotel Booking System

A full-featured hotel booking system built with the MERN stack (MongoDB, Express, React, Node.js) featuring role-based access control, room management, booking workflows, Stripe payments, and email notifications.

## Features

### For Customers
- Browse available rooms with filters (category, price range, capacity)
- View detailed room information with images, amenities, and reviews
- Book rooms with date selection and guest count
- Secure payment processing via Stripe
- View booking history and status
- Leave reviews for completed stays
- Email notifications for booking confirmations

### For Managers
- View and manage all bookings
- Update booking statuses (pending, confirmed, checked-in, checked-out, cancelled)
- Access booking analytics and reports

### For Administrators
- Full room management (create, edit, delete)
- User management across all roles
- System-wide analytics and reporting
- Manage all bookings and reviews

## Tech Stack

- **Frontend:** React, TypeScript, TailwindCSS, Shadcn/UI, TanStack Query
- **Backend:** Node.js, Express, TypeScript
- **Database:** MongoDB Atlas with Mongoose ODM
- **Authentication:** JWT tokens with bcrypt password hashing
- **Payments:** Stripe integration
- **Email:** Nodemailer for transactional emails

## Room Categories

- Standard - Budget-friendly options
- Deluxe - Enhanced comfort with premium amenities
- Suite - Spacious accommodations with separate living areas
- Executive - Business-focused with lounge access
- Family - Designed for families with kids' amenities
- Presidential - Luxury suites with butler service
- Penthouse - Top-floor premium accommodations

## Booking Statuses

1. **Pending** - Booking created, awaiting payment
2. **Confirmed** - Payment received, reservation confirmed
3. **Checked-in** - Guest has arrived
4. **Checked-out** - Stay completed
5. **Cancelled** - Booking cancelled

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Stripe account for payments

### Environment Variables

Required secrets:
- `MONGODB_URI` - MongoDB connection string
- `SESSION_SECRET` - Session encryption key
- `STRIPE_SECRET_KEY` - Stripe API secret key

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in Replit Secrets

3. Run the development server:
```bash
npm run dev
```

The application will be available at port 5000.

### Seeding Sample Data

To populate the database with sample rooms, bookings, and reviews:

```bash
npx tsx server/scripts/seed.ts
```

## Test Accounts

Use these accounts to test the application (all use the same password):

**Password for all accounts:** `Test@123`

| Role | Email | Access |
|------|-------|--------|
| Admin | admin@grandhorizon.com | Full system access, room management, user management |
| Manager | manager@grandhorizon.com | Booking management, status updates |
| Customer | guest@grandhorizon.com | Room browsing, booking, reviews |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Rooms
- `GET /api/rooms` - List all rooms
- `GET /api/rooms/:id` - Get room details with reviews
- `POST /api/admin/rooms` - Create room (admin)
- `PUT /api/admin/rooms/:id` - Update room (admin)
- `DELETE /api/admin/rooms/:id` - Delete room (admin)

### Bookings
- `GET /api/bookings` - User's bookings
- `POST /api/bookings` - Create booking
- `PATCH /api/bookings/:id/status` - Update status (manager/admin)
- `POST /api/bookings/:id/cancel` - Cancel booking

### Reviews
- `POST /api/reviews` - Create review
- `GET /api/rooms/:id/reviews` - Get room reviews

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utilities and hooks
│   │   └── hooks/          # Custom React hooks
├── server/                 # Express backend
│   ├── db/
│   │   ├── models/         # Mongoose models
│   │   └── connection.ts   # Database connection
│   ├── routes/             # API route handlers
│   ├── middleware/         # Express middleware
│   └── scripts/            # Utility scripts
├── shared/                 # Shared types and schemas
└── README.md
```

## License

This project is for demonstration purposes.
