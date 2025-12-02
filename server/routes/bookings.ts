import { Router, Response } from 'express';
import { Booking, Room, User } from '../db/models';
import { authenticate, AuthRequest } from '../middleware/auth';
import { sendBookingConfirmation } from '../services/email';
import { z } from 'zod';

const router = Router();

const createBookingSchema = z.object({
  roomId: z.string(),
  checkInDate: z.string().transform((s) => new Date(s)),
  checkOutDate: z.string().transform((s) => new Date(s)),
  totalPrice: z.number().positive(),
  guestCount: z.number().int().positive(),
  specialRequests: z.string().optional(),
});

router.use(authenticate);

router.get('/my', async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await Booking.find({ userId: req.user!._id })
      .populate('roomId')
      .sort({ createdAt: -1 });

    const bookingsWithDetails = bookings.map((booking) => {
      const bookingObj = booking.toJSON();
      const room = booking.roomId as any;
      return {
        ...bookingObj,
        roomId: room?._id?.toString() || bookingObj.roomId,
        room: room,
        user: {
          _id: req.user!._id.toString(),
          firstName: req.user!.firstName,
          lastName: req.user!.lastName,
          email: req.user!.email,
        },
      };
    });

    res.json(bookingsWithDetails);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      userId: req.user!._id,
    }).populate('roomId');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const bookingObj = booking.toJSON();
    const room = booking.roomId as any;
    const bookingWithDetails = {
      ...bookingObj,
      roomId: room?._id?.toString() || bookingObj.roomId,
      room: room,
      user: {
        _id: req.user!._id.toString(),
        firstName: req.user!.firstName,
        lastName: req.user!.lastName,
        email: req.user!.email,
      },
    };

    res.json(bookingWithDetails);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ message: 'Failed to fetch booking' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = createBookingSchema.parse(req.body);

    const room = await Room.findById(data.roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (!room.isAvailable) {
      return res.status(400).json({ message: 'Room is not available' });
    }

    const conflictingBookings = await Booking.find({
      roomId: data.roomId,
      status: { $nin: ['cancelled'] },
      $or: [
        {
          checkInDate: { $lt: data.checkOutDate },
          checkOutDate: { $gt: data.checkInDate },
        },
      ],
    });

    if (conflictingBookings.length > 0) {
      return res.status(400).json({ message: 'Room is not available for selected dates' });
    }

    const booking = new Booking({
      userId: req.user!._id,
      roomId: data.roomId,
      checkInDate: data.checkInDate,
      checkOutDate: data.checkOutDate,
      totalPrice: data.totalPrice,
      guestCount: data.guestCount,
      specialRequests: data.specialRequests,
      status: 'pending',
      paymentStatus: 'pending',
    });

    await booking.save();

    res.status(201).json({
      booking: booking.toJSON(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Failed to create booking' });
  }
});

router.post('/:id/confirm-payment', async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      userId: req.user!._id,
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = 'confirmed';
    booking.paymentStatus = 'paid';
    booking.paymentIntentId = `pi_simulated_${Date.now()}`;
    await booking.save();

    const room = await Room.findById(booking.roomId);
    if (room) {
      await sendBookingConfirmation(req.user!, booking, room);
    }

    res.json({ success: true, booking: booking.toJSON() });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ message: 'Failed to confirm payment' });
  }
});

router.patch('/:id/cancel', async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      userId: req.user!._id,
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    if (booking.status === 'checked_out') {
      return res.status(400).json({ message: 'Cannot cancel a completed booking' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (new Date(booking.checkInDate) <= today) {
      return res.status(400).json({ message: 'Cannot cancel booking on or after check-in date' });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json({ success: true, booking: booking.toJSON() });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ message: 'Failed to cancel booking' });
  }
});

export default router;
