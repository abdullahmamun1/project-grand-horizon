# Grand Horizon Hotel Booking System

A full-featured hotel booking system built with the MERN stack (MongoDB, Express, React, Node.js) featuring role-based access control, room management, booking workflows, Stripe payments, promo codes, and email notifications.

## Features

### For Customers
- Browse available rooms with filters (category, price range, capacity)
- View detailed room information with images, amenities, and reviews
- Book rooms with date selection and guest count
- Apply promo codes for discounts during checkout
- Secure payment processing via Stripe
- View booking history and status
- Leave reviews for completed stays
- Email confirmations for bookings

### For Managers
- Dashboard with real-time statistics
- View and manage all bookings
- Update booking statuses (pending, confirmed, checked_in, checked_out, cancelled)
- Today's check-ins and check-outs view
- Access booking analytics

### For Administrators
- Full room management (create, edit, delete rooms with images)
- Room statistics by category (total, available, occupied)
- Promo code management (create, edit, toggle, delete)
- User management across all roles
- System-wide analytics and reporting
- Manage all bookings and reviews

## Tech Stack

- **Frontend:** React 18, TypeScript, TailwindCSS, Shadcn/UI, TanStack Query, Wouter
- **Backend:** Node.js, Express, TypeScript
- **Database:** MongoDB Atlas with Mongoose ODM
- **Authentication:** JWT tokens with bcrypt password hashing
- **Payments:** Stripe integration (test mode)
- **Email:** Nodemailer with Gmail SMTP

## Room Categories

| Category | Description |
|----------|-------------|
| Standard | Budget-friendly options for comfortable stays |
| Deluxe | Enhanced comfort with premium amenities |
| Suite | Spacious accommodations with separate living areas |
| Executive | Business-focused with lounge access |
| Family | Designed for families with kids' amenities |
| Presidential | Luxury suites with butler service |
| Penthouse | Top-floor premium accommodations |

## Booking Statuses

| Status | Description |
|--------|-------------|
| `pending` | Booking created, awaiting payment |
| `confirmed` | Payment received, reservation confirmed |
| `checked_in` | Guest has arrived and checked in |
| `checked_out` | Stay completed |
| `cancelled` | Booking cancelled |

## Promo Code System

The system supports flexible promo codes with:
- **Discount Types:** Percentage (%) or Fixed amount ($)
- **Usage Limits:** Optional maximum usage count
- **Date Ranges:** Valid from/to dates
- **Minimum Spend:** Optional minimum booking amount requirement
- **Max Discount Cap:** Optional maximum discount limit for percentage codes

---

## Getting Started

### Prerequisites

- **Node.js 18 or higher** - Download from [nodejs.org](https://nodejs.org/)
- **Git** - Download from [git-scm.com](https://git-scm.com/download/win)
- **MongoDB Atlas account** (free tier available) - Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas)
- **Gmail account** for SMTP email notifications (or other SMTP provider)
- **Stripe account** for payment processing (optional) - Sign up at [stripe.com](https://stripe.com)

---

## Running Locally on Windows

### Step 1: Install Prerequisites

1. **Install Node.js:**
   - Download the Windows installer from [nodejs.org](https://nodejs.org/) (LTS version recommended)
   - Run the installer and follow the prompts
   - Verify installation by opening Command Prompt or PowerShell:
     ```cmd
     node --version
     npm --version
     ```

2. **Install Git:**
   - Download from [git-scm.com](https://git-scm.com/download/win)
   - Run the installer (default options are fine)
   - Verify installation:
     ```cmd
     git --version
     ```

### Step 2: Set Up MongoDB Atlas (Free Cloud Database)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free account
2. Create a new cluster (free tier M0 is sufficient)
3. Click **"Connect"** on your cluster
4. Choose **"Connect your application"**
5. Copy the connection string (looks like: `mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/`)
6. Replace `<password>` with your actual database user password
7. Add `/hotel` before the `?` to specify the database name:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/hotel?retryWrites=true&w=majority
   ```

**Important:** In MongoDB Atlas, go to **Network Access** and either:
- Add your current IP address, OR
- Add `0.0.0.0/0` to allow access from anywhere (for development)

### Step 3: Set Up Gmail for Email Notifications

1. Go to your [Google Account Security Settings](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already enabled
3. Go to **App passwords** (under 2-Step Verification)
4. Select **Mail** and **Windows Computer**
5. Click **Generate** and copy the 16-character password
6. Use this password as your `SMTP_PASS` (not your regular Gmail password)

### Step 4: Clone and Set Up the Project

Open Command Prompt or PowerShell and run:

```cmd
# Clone the repository
git clone <repository-url>
cd grand-horizon-hotel

# Install dependencies
npm install

# Create environment file
copy .env.example .env
```

### Step 5: Configure Environment Variables

Open the `.env` file in a text editor (Notepad, VS Code, etc.) and fill in your values:

```env
# Database (Required)
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/hotel?retryWrites=true&w=majority

# Session Secret (Required) - Any random string 32+ characters
SESSION_SECRET=your-super-secret-key-at-least-32-characters-long

# Email Configuration (Required for booking confirmations)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password

# Stripe (Optional - for payments)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
```

### Step 6: Run the Application

**Option A: Using PowerShell (Recommended)**
```powershell
$env:NODE_ENV="development"; npx tsx server/index.ts
```

**Option B: Using Command Prompt (cmd)**
```cmd
set NODE_ENV=development && npx tsx server/index.ts
```

**Option C: Create a batch file**

Create a file named `start-dev.bat` in the project root with:
```batch
@echo off
set NODE_ENV=development
npx tsx server/index.ts
```
Then double-click the file or run `start-dev.bat` from Command Prompt.

The application will start and be available at: **http://localhost:5000**

### Step 7: Seed Sample Data (Optional)

To populate the database with sample rooms, users, and bookings:

```cmd
npx tsx server/scripts/seed.ts
```

This creates:
- 11 sample rooms across all categories
- 3 test user accounts (admin, manager, customer)
- 5 sample customer accounts with booking history
- Sample bookings with various statuses
- Sample reviews for rooms

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/hotel?retryWrites=true&w=majority` |
| `SESSION_SECRET` | Secret key for session encryption (min 32 chars) | `my-super-secret-session-key-here` |

### Email Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username/email | `your-email@gmail.com` |
| `SMTP_PASS` | SMTP password or app password | `your-app-password` |

### Payment Configuration (Optional)

| Variable | Description | Example |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Stripe API secret key | `sk_test_...` |
| `VITE_STRIPE_PUBLIC_KEY` | Stripe publishable key (frontend) | `pk_test_...` |

---

## Test Accounts

Use these accounts to test the application:

**Password for all accounts:** `Test@123`

| Role | Email | Access Level |
|------|-------|--------------|
| Admin | `admin@grandhorizon.com` | Full system access, room management, promo codes, user management |
| Manager | `manager@grandhorizon.com` | Booking management, status updates, dashboard |
| Customer | `guest@grandhorizon.com` | Room browsing, booking, reviews |

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get current user |

### Rooms
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rooms` | List all rooms with reviews |
| GET | `/api/rooms/:id` | Get room details |
| POST | `/api/admin/rooms` | Create room (admin) |
| PUT | `/api/admin/rooms/:id` | Update room (admin) |
| DELETE | `/api/admin/rooms/:id` | Delete room (admin) |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings/my` | Get user's bookings |
| POST | `/api/bookings` | Create booking |
| POST | `/api/bookings/validate-promo` | Validate promo code |
| POST | `/api/bookings/:id/confirm-payment` | Confirm payment |
| PATCH | `/api/bookings/:id/cancel` | Cancel booking |

### Manager Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/manager/bookings` | All bookings |
| GET | `/api/manager/bookings/today` | Today's check-ins |
| GET | `/api/manager/stats` | Dashboard statistics |
| PATCH | `/api/manager/bookings/:id/status` | Update booking status |

### Admin Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Room statistics |
| GET | `/api/admin/promo-codes` | List promo codes |
| POST | `/api/admin/promo-codes` | Create promo code |
| PUT | `/api/admin/promo-codes/:id` | Update promo code |
| DELETE | `/api/admin/promo-codes/:id` | Delete promo code |
| PATCH | `/api/admin/promo-codes/:id/toggle` | Toggle promo code active status |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reviews` | Create review (after checkout) |

---

## Project Structure

```
grand-horizon-hotel/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   └── ui/             # Shadcn UI components
│   │   ├── pages/              # Page components
│   │   │   ├── admin/          # Admin dashboard pages
│   │   │   ├── manager/        # Manager dashboard pages
│   │   │   └── auth/           # Login/Register pages
│   │   ├── lib/                # Utilities (auth, api, query client)
│   │   └── hooks/              # Custom React hooks
│   └── index.html
├── server/                     # Express backend
│   ├── db/
│   │   ├── models/             # Mongoose models (User, Room, Booking, Review, PromoCode)
│   │   └── connection.ts       # MongoDB connection
│   ├── routes/                 # API route handlers
│   │   ├── auth.ts             # Authentication routes
│   │   ├── rooms.ts            # Room routes
│   │   ├── bookings.ts         # Booking routes
│   │   ├── manager.ts          # Manager routes
│   │   ├── admin.ts            # Admin routes
│   │   └── reviews.ts          # Review routes
│   ├── middleware/             # Express middleware (auth)
│   ├── services/               # Business logic (email service)
│   ├── scripts/                # Utility scripts (seed)
│   └── index.ts                # Server entry point
├── shared/                     # Shared types and schemas
│   └── schema.ts               # Zod schemas and types
├── uploads/                    # Uploaded room images
├── .env.example                # Example environment variables
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
└── README.md
```

---

## Deployment

### On Replit

1. Click the "Deploy" button in the Replit interface
2. Configure environment secrets in the Secrets tab
3. The application will be automatically deployed

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

---

## Troubleshooting

### Common Issues

1. **MongoDB Connection Fails**
   - Verify your `MONGODB_URI` is correct
   - Check if your IP is whitelisted in MongoDB Atlas
   - Ensure the database user has proper permissions

2. **Email Not Sending**
   - For Gmail, ensure you're using an App Password (not your regular password)
   - Check if 2-Step Verification is enabled on your Google account
   - Verify SMTP settings are correct

3. **Stripe Payments Not Working**
   - Ensure you're using test mode keys (start with `sk_test_` and `pk_test_`)
   - Check that your Stripe account is properly set up

4. **Images Not Uploading**
   - Ensure the `uploads/` directory exists and has write permissions
   - Check file size limits (max 5MB per image)

---

## License

This project is for demonstration and educational purposes.

---

## Support

For issues or questions, please open an issue in the repository or contact the development team.
