import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
}

const reviewSchema = new Schema<IReview>({
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
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
    minlength: 10,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

reviewSchema.index({ roomId: 1 });
reviewSchema.index({ userId: 1 });

reviewSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret._id = ret._id.toString();
    if (ret.userId) ret.userId = ret.userId.toString();
    if (ret.roomId) ret.roomId = ret.roomId.toString();
    if (ret.bookingId) ret.bookingId = ret.bookingId.toString();
    delete ret.__v;
    return ret;
  },
});

export const Review = mongoose.model<IReview>('Review', reviewSchema);
