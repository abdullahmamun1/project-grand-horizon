import { Router, Response } from 'express';
import { Booking, Room, User, PromoCode } from '../db/models';
import { authenticate, AuthRequest } from '../middleware/auth';
import { sendBookingConfirmation } from '../services/email';
import { createPaymentIntent, verifyPaymentIntent, getStripePublishableKey } from '../services/stripe';
import { z } from 'zod';

// Helper function to validate and calculate promo code discount
async function validatePromoCode(code: string, bookingAmount: number) {
  const promoCode = await PromoCode.findOne({ 
    code: code.toUpperCase(),
    isActive: true,
  });

  if (!promoCode) {
    return { valid: false, error: 'Invalid promo code' };
  }

  const now = new Date();
  if (now < promoCode.validFrom || now > promoCode.validTo) {
    return { valid: false, error: 'Promo code has expired or is not yet active' };
  }

  if (promoCode.usageLimit && promoCode.usageCount >= promoCode.usageLimit) {
    return { valid: false, error: 'Promo code has reached its usage limit' };
  }

  if (bookingAmount < promoCode.minBookingAmount) {
    return { 
      valid: false, 
      error: `Minimum booking amount of $${promoCode.minBookingAmount} required` 
    };
  }

  let discountAmount = 0;
  if (promoCode.discountType === 'percentage') {
    discountAmount = (bookingAmount * promoCode.discountValue) / 100;
  } else {
    discountAmount = promoCode.discountValue;
  }

  if (promoCode.maxDiscountAmount && discountAmount > promoCode.maxDiscountAmount) {
    discountAmount = promoCode.maxDiscountAmount;
  }

  discountAmount = Math.min(discountAmount, bookingAmount);

  return {
    valid: true,
    promoCode,
    discountAmount: Math.round(discountAmount * 100) / 100,
    finalPrice: Math.round((bookingAmount - discountAmount) * 100) / 100,
    description: promoCode.description,
    discountType: promoCode.discountType,
    discountValue: promoCode.discountValue,
  };
}

const router = Router();

// Get Stripe publishable key (no auth required for this)
router.get('/stripe-key', async (_req, res: Response) => {
  try {
    const publishableKey = await getStripePublishableKey();
    res.json({ publishableKey });
  } catch (error) {
    console.error('Error getting Stripe key:', error);
    res.status(500).json({ message: 'Payment service unavailable' });
  }
});

const createBookingSchema = z.object({
  roomId: z.string(),
  checkInDate: z.string().transform((s) => new Date(s)),
  checkOutDate: z.string().transform((s) => new Date(s)),
  totalPrice: z.number().positive(),
  guestCount: z.number().int().positive(),
  specialRequests: z.string().optional(),
  promoCode: z.string().optional(),
});

router.use(authenticate);

// Validate promo code endpoint
router.post('/validate-promo', async (req: AuthRequest, res: Response) => {
  try {
    const { code, bookingAmount } = req.body;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ valid: false, error: 'Promo code is required' });
    }
    
    if (!bookingAmount || typeof bookingAmount !== 'number' || bookingAmount <= 0) {
      return res.status(400).json({ valid: false, error: 'Valid booking amount is required' });
    }

    const result = await validatePromoCode(code, bookingAmount);
    
    if (!result.valid) {
      return res.json({ valid: false, error: result.error });
    }

    res.json({
      valid: true,
      code: result.promoCode!.code,
      discountAmount: result.discountAmount,
      finalPrice: result.finalPrice,
      description: result.description,
      discountType: result.discountType,
      discountValue: result.discountValue,
    });
  } catch (error) {
    console.error('Error validating promo code:', error);
    res.status(500).json({ valid: false, error: 'Failed to validate promo code' });
  }
});

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

    let discountAmount = 0;
    let finalPrice = data.totalPrice;
    let appliedPromoCode: string | undefined = undefined;

    // Validate and apply promo code if provided
    if (data.promoCode) {
      const promoResult = await validatePromoCode(data.promoCode, data.totalPrice);
      if (!promoResult.valid) {
        return res.status(400).json({ message: promoResult.error });
      }
      discountAmount = promoResult.discountAmount!;
      finalPrice = promoResult.finalPrice!;
      appliedPromoCode = promoResult.promoCode!.code;

      // Increment promo code usage count
      await PromoCode.findByIdAndUpdate(promoResult.promoCode!._id, {
        $inc: { usageCount: 1 }
      });
    }

    const booking = new Booking({
      userId: req.user!._id,
      roomId: data.roomId,
      checkInDate: data.checkInDate,
      checkOutDate: data.checkOutDate,
      totalPrice: data.totalPrice,
      discountAmount,
      finalPrice,
      promoCode: appliedPromoCode,
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

// Create a payment intent for a booking
router.post('/:id/create-payment-intent', async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      userId: req.user!._id,
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Booking is not in pending status' });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Booking is already paid' });
    }

    // Use finalPrice if promo was applied, otherwise totalPrice
    const amount = booking.finalPrice || booking.totalPrice;

    const { clientSecret, paymentIntentId } = await createPaymentIntent(
      amount,
      booking._id.toString(),
      req.user!.email
    );

    // Store the payment intent ID on the booking
    booking.paymentIntentId = paymentIntentId;
    await booking.save();

    res.json({ clientSecret, paymentIntentId });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ message: 'Failed to create payment intent' });
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

    // Check if already confirmed
    if (booking.paymentStatus === 'paid') {
      return res.json({ success: true, booking: booking.toJSON() });
    }

    // Check if we have a payment intent for real Stripe verification
    if (booking.paymentIntentId) {
      // Verify with Stripe that payment succeeded
      try {
        const paymentIntent = await verifyPaymentIntent(booking.paymentIntentId);
        
        if (paymentIntent.status !== 'succeeded') {
          return res.status(400).json({ 
            message: 'Payment has not been completed',
            paymentStatus: paymentIntent.status 
          });
        }

        // Verify the payment intent matches this booking
        const expectedBookingId = booking._id.toString();
        if (paymentIntent.metadata?.bookingId !== expectedBookingId) {
          console.error(`Payment intent booking ID mismatch: expected ${expectedBookingId}, got ${paymentIntent.metadata?.bookingId}`);
          return res.status(400).json({ 
            message: 'Payment verification failed: booking mismatch' 
          });
        }

        // Verify the amount matches (convert booking price to cents)
        const expectedAmount = Math.round((booking.finalPrice || booking.totalPrice) * 100);
        const actualAmount = paymentIntent.amount_received || paymentIntent.amount;
        if (actualAmount !== expectedAmount) {
          console.error(`Payment amount mismatch: expected ${expectedAmount}, got ${actualAmount}`);
          return res.status(400).json({ 
            message: 'Payment verification failed: amount mismatch' 
          });
        }

        // Verify currency matches
        if (paymentIntent.currency !== 'usd') {
          console.error(`Payment currency mismatch: expected usd, got ${paymentIntent.currency}`);
          return res.status(400).json({ 
            message: 'Payment verification failed: currency mismatch' 
          });
        }
      } catch (stripeError: any) {
        console.error('Error verifying payment with Stripe:', stripeError);
        return res.status(400).json({ 
          message: 'Payment verification failed. Please try again or contact support.',
          error: stripeError.message 
        });
      }
    }
    // If no payment intent, allow test mode confirmation
    // This enables the simulated payment form to work

    // Payment verified (or test mode) - update booking status
    booking.status = 'confirmed';
    booking.paymentStatus = 'paid';
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
