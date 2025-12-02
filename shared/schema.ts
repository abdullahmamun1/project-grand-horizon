import { z } from "zod";

// ============ USER SCHEMA ============
export const userRoles = ["customer", "manager", "admin"] as const;
export type UserRole = (typeof userRoles)[number];

export const userSchema = z.object({
  _id: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum(userRoles).default("customer"),
  createdAt: z.date(),
});

export const insertUserSchema = userSchema.omit({ _id: true, createdAt: true });
export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export const registerUserSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;

// ============ ROOM SCHEMA ============
export const roomCategories = [
  "Standard",
  "Deluxe",
  "Suite",
  "Executive",
  "Presidential",
  "Family",
  "Penthouse",
] as const;
export type RoomCategory = (typeof roomCategories)[number];

export const predefinedAmenities = [
  "WiFi",
  "Air Conditioning",
  "TV",
  "Mini Bar",
  "Room Service",
  "Ocean View",
  "Balcony",
  "King Bed",
  "Queen Bed",
  "Twin Beds",
  "Jacuzzi",
  "Safe",
  "Coffee Maker",
  "Refrigerator",
  "Work Desk",
  "Hair Dryer",
  "Iron",
  "Bathtub",
  "Shower",
  "Slippers",
  "Bathrobes",
  "Complimentary Breakfast",
  "Other",
] as const;

export const roomSchema = z.object({
  _id: z.string(),
  name: z.string().min(1),
  description: z.string().min(10),
  category: z.enum(roomCategories),
  pricePerNight: z.number().positive(),
  capacity: z.number().int().positive(),
  images: z.array(z.string()),
  amenities: z.array(z.string()),
  isAvailable: z.boolean().default(true),
  roomNumber: z.string(),
  createdAt: z.date(),
});

export const insertRoomSchema = roomSchema.omit({ _id: true, createdAt: true });

export type Room = z.infer<typeof roomSchema>;
export type InsertRoom = z.infer<typeof insertRoomSchema>;

// ============ BOOKING SCHEMA ============
export const bookingStatuses = [
  "pending",
  "confirmed",
  "checked_in",
  "checked_out",
  "cancelled",
] as const;
export type BookingStatus = (typeof bookingStatuses)[number];

export const bookingSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  roomId: z.string(),
  checkInDate: z.date(),
  checkOutDate: z.date(),
  totalPrice: z.number().positive(),
  discountAmount: z.number().min(0).default(0),
  finalPrice: z.number().positive(),
  promoCode: z.string().optional(),
  status: z.enum(bookingStatuses).default("pending"),
  guestCount: z.number().int().positive(),
  specialRequests: z.string().optional(),
  paymentIntentId: z.string().optional(),
  paymentStatus: z.enum(["pending", "paid", "refunded"]).default("pending"),
  createdAt: z.date(),
});

export const insertBookingSchema = bookingSchema.omit({ _id: true, createdAt: true, paymentIntentId: true, paymentStatus: true, status: true });

export type Booking = z.infer<typeof bookingSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

// ============ REVIEW SCHEMA ============
export const reviewSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  roomId: z.string(),
  bookingId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10),
  createdAt: z.date(),
});

export const insertReviewSchema = reviewSchema.omit({ _id: true, createdAt: true });

export type Review = z.infer<typeof reviewSchema>;
export type InsertReview = z.infer<typeof insertReviewSchema>;

// ============ PROMO CODE SCHEMA ============
export const discountTypes = ["percentage", "fixed"] as const;
export type DiscountType = (typeof discountTypes)[number];

export const promoCodeSchema = z.object({
  _id: z.string(),
  code: z.string().min(3).max(20),
  description: z.string().optional(),
  discountType: z.enum(discountTypes),
  discountValue: z.number().positive(),
  minBookingAmount: z.number().min(0).default(0),
  maxDiscountAmount: z.number().positive().optional(),
  validFrom: z.date(),
  validTo: z.date(),
  usageLimit: z.number().int().positive().optional(),
  usageCount: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
});

export const insertPromoCodeSchema = promoCodeSchema.omit({ _id: true, createdAt: true, usageCount: true });

export type PromoCode = z.infer<typeof promoCodeSchema>;
export type InsertPromoCode = z.infer<typeof insertPromoCodeSchema>;

// ============ API RESPONSE TYPES ============
export interface AuthResponse {
  user: Omit<User, "password">;
  token: string;
}

export interface RoomWithReviews extends Room {
  reviews: (Review & { user: Pick<User, "_id" | "firstName" | "lastName"> })[];
  averageRating: number;
}

export interface BookingWithDetails extends Booking {
  room: Room;
  user: Pick<User, "_id" | "firstName" | "lastName" | "email">;
}

// ============ FILTER TYPES ============
export interface RoomFilters {
  category?: RoomCategory;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}
