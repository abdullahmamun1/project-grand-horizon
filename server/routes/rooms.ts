import { Router, Request, Response } from 'express';
import { Room, Review, Booking } from '../db/models';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      amenities,
      limit = '20',
      offset = '0',
    } = req.query;

    const filter: any = { isAvailable: true };

    if (category) {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      filter.pricePerNight = {};
      if (minPrice) filter.pricePerNight.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerNight.$lte = Number(maxPrice);
    }

    if (amenities) {
      const amenityList = (amenities as string).split(',').map(a => a.trim());
      filter.amenities = { $all: amenityList };
    }

    const rooms = await Room.find(filter)
      .limit(Number(limit))
      .skip(Number(offset))
      .sort({ createdAt: -1 });

    const roomsWithReviews = await Promise.all(
      rooms.map(async (room) => {
        const reviews = await Review.find({ roomId: room._id })
          .populate('userId', 'firstName lastName')
          .sort({ createdAt: -1 });

        const averageRating =
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        return {
          ...room.toJSON(),
          reviews: reviews.map((r) => ({
            ...r.toJSON(),
            user: r.userId,
          })),
          averageRating,
        };
      })
    );

    res.json(roomsWithReviews);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ message: 'Failed to fetch rooms' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const reviews = await Review.find({ roomId: room._id })
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 });

    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    res.json({
      ...room.toJSON(),
      reviews: reviews.map((r) => ({
        ...r.toJSON(),
        user: r.userId,
      })),
      averageRating,
    });
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ message: 'Failed to fetch room' });
  }
});

router.get('/:id/availability', async (req: Request, res: Response) => {
  try {
    const { checkIn, checkOut } = req.query;
    
    if (!checkIn || !checkOut) {
      return res.status(400).json({ message: 'Check-in and check-out dates required' });
    }

    const checkInDate = new Date(checkIn as string);
    const checkOutDate = new Date(checkOut as string);

    const conflictingBookings = await Booking.find({
      roomId: req.params.id,
      status: { $nin: ['cancelled'] },
      $or: [
        {
          checkInDate: { $lt: checkOutDate },
          checkOutDate: { $gt: checkInDate },
        },
      ],
    });

    res.json({
      available: conflictingBookings.length === 0,
      conflictingBookings: conflictingBookings.length,
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ message: 'Failed to check availability' });
  }
});

export default router;
