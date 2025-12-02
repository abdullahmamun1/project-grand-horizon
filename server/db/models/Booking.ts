import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  checkInDate: Date;
  checkOutDate: Date;
  totalPrice: number;
  discountAmount: number;
  finalPrice: number;
  promoCode?: string;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  guestCount: number;
  specialRequests?: string;
  paymentIntentId?: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: Date;
}

const bookingSchema = new Schema<IBooking>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  roomId: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  checkInDate: {
    type: Date,
    required: true,
  },
  checkOutDate: {
    type: Date,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  finalPrice: {
    type: Number,
    min: 0,
  },
  promoCode: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'],
    default: 'pending',
  },
  guestCount: {
    type: Number,
    required: true,
    min: 1,
  },
  specialRequests: {
    type: String,
  },
  paymentIntentId: {
    type: String,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

bookingSchema.index({ userId: 1 });
bookingSchema.index({ roomId: 1 });
bookingSchema.index({ checkInDate: 1, checkOutDate: 1 });

// Pre-save hook to set finalPrice to totalPrice if not set
bookingSchema.pre('save', function() {
  if (this.finalPrice === undefined || this.finalPrice === null) {
    this.finalPrice = this.totalPrice - (this.discountAmount || 0);
  }
});

bookingSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret._id = ret._id.toString();
    if (ret.userId) ret.userId = ret.userId.toString();
    if (ret.roomId) ret.roomId = ret.roomId.toString();
    delete ret.__v;
    return ret;
  },
});

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
