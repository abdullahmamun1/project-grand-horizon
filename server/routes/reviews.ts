import { Router, Response } from 'express';
import { Review, Booking } from '../db/models';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

const createReviewSchema = z.object({
  bookingId: z.string(),
  roomId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10),
});

router.use(authenticate);

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = createReviewSchema.parse(req.body);

    const booking = await Booking.findOne({
      _id: data.bookingId,
      userId: req.user!._id,
      roomId: data.roomId,
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'checked_out') {
      return res.status(400).json({ message: 'Can only review after checkout' });
    }

    const existingReview = await Review.findOne({ bookingId: data.bookingId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this stay' });
    }

    const review = new Review({
      userId: req.user!._id,
      roomId: data.roomId,
      bookingId: data.bookingId,
      rating: data.rating,
      comment: data.comment,
    });

    await review.save();

    res.status(201).json(review.toJSON());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Failed to create review' });
  }
});

router.get('/my', async (req: AuthRequest, res: Response) => {
  try {
    const reviews = await Review.find({ userId: req.user!._id })
      .populate('roomId', 'name images')
      .sort({ createdAt: -1 });

    res.json(reviews.map((r) => ({
      ...r.toJSON(),
      room: r.roomId,
    })));
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});

export default router;
