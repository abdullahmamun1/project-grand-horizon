import { Router, Response } from 'express';
import { Booking, Room } from '../db/models';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(requireRole('manager', 'admin'));

router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayCheckIns, todayCheckOuts, currentGuests, pendingBookings] = await Promise.all([
      Booking.countDocuments({
        checkInDate: { $gte: today, $lt: tomorrow },
        status: { $in: ['pending', 'confirmed'] },
      }),
      Booking.countDocuments({
        checkOutDate: { $gte: today, $lt: tomorrow },
        status: 'checked_in',
      }),
      Booking.countDocuments({ status: 'checked_in' }),
      Booking.countDocuments({ status: 'pending' }),
    ]);

    res.json({
      todayCheckIns,
      todayCheckOuts,
      currentGuests,
      pendingBookings,
    });
  } catch (error) {
    console.error('Error fetching manager stats:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

router.get('/bookings', async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await Booking.find()
      .populate('userId', 'firstName lastName email phone')
      .populate('roomId', 'name roomNumber category images')
      .sort({ checkInDate: 1 });

    const bookingsWithDetails = bookings.map((booking) => ({
      ...booking.toJSON(),
      user: booking.userId,
      room: booking.roomId,
    }));

    res.json(bookingsWithDetails);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

router.get('/bookings/today', async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const bookings = await Booking.find({
      $or: [
        {
          checkInDate: { $gte: today, $lt: tomorrow },
          status: { $in: ['pending', 'confirmed'] },
        },
        {
          checkOutDate: { $gte: today, $lt: tomorrow },
          status: 'checked_in',
        },
      ],
    })
      .populate('userId', 'firstName lastName email phone')
      .populate('roomId', 'name roomNumber category images')
      .sort({ checkInDate: 1 });

    const bookingsWithDetails = bookings.map((booking) => ({
      ...booking.toJSON(),
      user: booking.userId,
      room: booking.roomId,
    }));

    res.json(bookingsWithDetails);
  } catch (error) {
    console.error('Error fetching today bookings:', error);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

router.patch('/bookings/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    
    if (!['checked_in', 'checked_out'].includes(status)) {
      return res.status(400).json({ message: 'Managers can only check-in or check-out guests' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (status === 'checked_in') {
      if (!['pending', 'confirmed'].includes(booking.status)) {
        return res.status(400).json({ message: 'Can only check-in pending or confirmed bookings' });
      }
    }

    if (status === 'checked_out') {
      if (booking.status !== 'checked_in') {
        return res.status(400).json({ message: 'Can only check-out checked-in guests' });
      }
    }

    booking.status = status;
    await booking.save();

    res.json(booking.toJSON());
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ message: 'Failed to update status' });
  }
});

export default router;
