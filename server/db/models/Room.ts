import mongoose, { Schema, Document } from 'mongoose';

export interface IRoom extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  category: 'Standard' | 'Deluxe' | 'Suite' | 'Executive' | 'Presidential' | 'Family' | 'Penthouse';
  pricePerNight: number;
  capacity: number;
  images: string[];
  amenities: string[];
  isAvailable: boolean;
  roomNumber: string;
  createdAt: Date;
}

const roomSchema = new Schema<IRoom>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    minlength: 10,
  },
  category: {
    type: String,
    enum: ['Standard', 'Deluxe', 'Suite', 'Executive', 'Presidential', 'Family', 'Penthouse'],
    required: true,
  },
  pricePerNight: {
    type: Number,
    required: true,
    min: 0,
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
  },
  images: [{
    type: String,
  }],
  amenities: [{
    type: String,
  }],
  isAvailable: {
    type: Boolean,
    default: true,
  },
  roomNumber: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

roomSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret._id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

export const Room = mongoose.model<IRoom>('Room', roomSchema);
