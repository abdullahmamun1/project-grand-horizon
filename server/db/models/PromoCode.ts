import mongoose, { Schema, Document } from 'mongoose';

export interface IPromoCode extends Document {
  _id: mongoose.Types.ObjectId;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minBookingAmount: number;
  maxDiscountAmount?: number;
  validFrom: Date;
  validTo: Date;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  createdAt: Date;
}

const promoCodeSchema = new Schema<IPromoCode>({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
  },
  description: {
    type: String,
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0,
  },
  minBookingAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  maxDiscountAmount: {
    type: Number,
    min: 0,
  },
  validFrom: {
    type: Date,
    required: true,
  },
  validTo: {
    type: Date,
    required: true,
  },
  usageLimit: {
    type: Number,
    min: 1,
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Note: code field already has unique: true which creates an index
promoCodeSchema.index({ isActive: 1, validFrom: 1, validTo: 1 });

promoCodeSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret._id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

export const PromoCode = mongoose.model<IPromoCode>('PromoCode', promoCodeSchema);
