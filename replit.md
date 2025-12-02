# Grand Horizon Hotel - Booking System

## Overview

Grand Horizon Hotel is a full-stack hotel booking and management platform built with React, Express, and MongoDB. The application provides a complete booking flow for customers, along with dedicated dashboards for managers and administrators to handle operations. The platform draws design inspiration from leading hospitality services like Airbnb, Booking.com, and Marriott to create a trustworthy and visually appealing experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type safety
- Vite as the build tool and development server with hot module replacement (HMR)
- Wouter for lightweight client-side routing instead of React Router
- TanStack Query (React Query) for server state management and caching

**UI Component System**
- shadcn/ui component library (New York style variant) with Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Custom CSS variables for theming (light/dark mode support)
- Component path aliases configured via TypeScript paths (@/components, @/lib, etc.)

**State Management Strategy**
- AuthContext for global authentication state (JWT token + user object)
- ThemeContext for light/dark mode preferences
- TanStack Query for all server state (rooms, bookings, reviews)
- Local component state for UI interactions

**Key Design Decisions**
- Server-side rendering not used; single-page application (SPA) architecture
- Authentication via JWT tokens stored in localStorage
- API calls use custom fetch wrapper with automatic token injection
- Protected routes implemented via ProtectedRoute wrapper component with role-based access

### Backend Architecture

**Server Framework**
- Express.js for HTTP server and REST API endpoints
- MongoDB with Mongoose ODM for data persistence
- Custom middleware for authentication and authorization

**API Structure**
- `/api/auth` - User registration, login, token generation
- `/api/rooms` - Room listings, filtering, and details
- `/api/bookings` - Booking creation and management
- `/api/reviews` - Post-stay review submissions
- `/api/admin` - Administrative operations (room management, image uploads)
- `/api/manager` - Manager dashboard statistics and booking operations

**Authentication & Authorization**
- JWT-based authentication with bcrypt password hashing
- Three role types: customer, manager, admin
- Middleware chain: authenticate → requireRole for protected endpoints
- Token expiration set to 7 days

**File Upload Handling**
- Multer middleware for multipart/form-data processing
- Image uploads stored in local `/uploads` directory
- File type validation (jpeg, jpg, png, webp only)
- 5MB file size limit per image

**Email Service**
- Nodemailer integration for booking confirmations
- SMTP configuration via environment variables
- HTML email templates with booking details

### Data Models (MongoDB/Mongoose)

**User Model**
- Fields: email (unique), password (hashed), firstName, lastName, phone, role, createdAt
- Password comparison method for authentication
- Indexes on email field for query performance

**Room Model**
- Fields: name, description, category, pricePerNight, capacity, images[], amenities[], isAvailable, roomNumber, createdAt
- Categories: Standard, Deluxe, Suite, Executive, Presidential, Family, Penthouse
- Images stored as URL strings (path to uploaded files)

**Booking Model**
- Fields: userId (ref), roomId (ref), checkInDate, checkOutDate, totalPrice, status, guestCount, specialRequests, paymentIntentId, paymentStatus, createdAt
- Status types: pending, confirmed, checked_in, checked_out, cancelled
- Payment status: pending, paid, refunded
- Populated references for user and room details in responses

**Review Model**
- Fields: userId (ref), roomId (ref), bookingId (ref, unique), rating (1-5), comment, createdAt
- One review per booking constraint via unique index
- Can only review after checkout status
- Reviews aggregated for room average ratings

### Database Strategy

**Initial Configuration**
- Project configured for PostgreSQL with Drizzle ORM (drizzle.config.ts, schema references)
- Actual implementation uses MongoDB with Mongoose
- Database connection handles missing MONGODB_URI gracefully with warnings
- Connection state tracking to prevent redundant connections

**Migration Path**
- Schema definitions exist in shared/schema.ts using Zod validators
- These schemas mirror the Mongoose models for validation
- Future migration to PostgreSQL possible by implementing Drizzle schema

## External Dependencies

### Core Infrastructure
- **MongoDB**: Primary database (connection via MONGODB_URI environment variable)
- **Neon Database (Configured but not active)**: PostgreSQL provider configured via @neondatabase/serverless package

### Email Service
- **SMTP Server**: Email delivery for booking confirmations
  - Configuration: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS environment variables
  - Defaults to Ethereal Email for development/testing

### Third-Party UI Libraries
- **Radix UI**: Accessible component primitives (40+ packages including dialog, dropdown, select, etc.)
- **Lucide React**: Icon library for consistent iconography
- **Embla Carousel**: Carousel/slider functionality (via embla-carousel-react)
- **React Day Picker**: Calendar component for date selection
- **CMDK**: Command palette component
- **Vaul**: Drawer component primitives

### Development & Build Tools
- **Replit-specific plugins**: 
  - @replit/vite-plugin-runtime-error-modal
  - @replit/vite-plugin-cartographer
  - @replit/vite-plugin-dev-banner
- **ESBuild**: Server-side bundling for production builds
- **PostCSS & Autoprefixer**: CSS processing pipeline

### Utilities & Validation
- **Zod**: Schema validation for API requests and responses
- **React Hook Form**: Form state management with @hookform/resolvers
- **date-fns**: Date manipulation and formatting
- **clsx & tailwind-merge**: Conditional className utilities
- **class-variance-authority**: Component variant management

### Security & Authentication
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT token generation and verification

### File Processing
- **Multer**: Multipart form data and file uploads

### Potential Payment Integration
- Payment-related fields exist in booking model (paymentIntentId, paymentStatus) suggesting future Stripe or similar integration, though not currently implemented