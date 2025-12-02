import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Room, Booking, User, Review } from '../db/models';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  },
});

router.use(authenticate);
router.use(requireRole('admin'));

const roomSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(10),
  category: z.enum(['Standard', 'Deluxe', 'Suite', 'Executive', 'Presidential', 'Family', 'Penthouse']),
  pricePerNight: z.number().positive(),
  capacity: z.number().int().positive(),
  roomNumber: z.string().min(1),
  images: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  isAvailable: z.boolean().optional(),
});

router.get('/room-stats', async (req: AuthRequest, res: Response) => {
  try {
    const rooms = await Room.find().lean();
    const occupiedBookings = await Booking.find({ status: 'checked_in' }).lean();
    
    const occupiedRoomIds = new Set(
      occupiedBookings.map((b) => b.roomId.toString())
    );

    const categories = ['Standard', 'Deluxe', 'Suite', 'Executive', 'Presidential', 'Family', 'Penthouse'];
    
    const statsByCategory = categories.map((category) => {
      const categoryRooms = rooms.filter((r) => r.category === category);
      const totalRooms = categoryRooms.length;
      const occupiedRooms = categoryRooms.filter((r) => occupiedRoomIds.has(r._id.toString())).length;
      const availableRooms = categoryRooms.filter(
        (r) => r.isAvailable && !occupiedRoomIds.has(r._id.toString())
      ).length;

      return {
        category,
        totalRooms,
        availableRooms,
        occupiedRooms,
      };
    });

    const totals = {
      totalRooms: rooms.length,
      availableRooms: rooms.filter((r) => r.isAvailable && !occupiedRoomIds.has(r._id.toString())).length,
      occupiedRooms: occupiedRoomIds.size,
    };

    res.json({ statsByCategory, totals });
  } catch (error) {
    console.error('Error fetching room stats:', error);
    res.status(500).json({ message: 'Failed to fetch room statistics' });
  }
});

router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const [totalRooms, totalBookings, revenueAgg, checkedInCount] = await Promise.all([
      Room.countDocuments(),
      Booking.countDocuments({ status: { $ne: 'cancelled' } }),
      Booking.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      Booking.countDocuments({ status: 'checked_in' }),
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;
    const occupancyRate = totalRooms > 0 
      ? Math.round((checkedInCount / totalRooms) * 100) 
      : 0;

    res.json({
      totalRooms,
      totalBookings,
      totalRevenue,
      occupancyRate,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

router.get('/rooms', async (req: AuthRequest, res: Response) => {
  try {
    const rooms = await Room.find().sort({ createdAt: -1 });
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ message: 'Failed to fetch rooms' });
  }
});

router.post('/rooms', async (req: AuthRequest, res: Response) => {
  try {
    const data = roomSchema.parse(req.body);

    const existingRoom = await Room.findOne({ roomNumber: data.roomNumber });
    if (existingRoom) {
      return res.status(400).json({ message: 'Room number already exists' });
    }

    const room = new Room({
      ...data,
      images: data.images || [],
      amenities: data.amenities || [],
      isAvailable: data.isAvailable ?? true,
    });

    await room.save();
    res.status(201).json(room.toJSON());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    console.error('Error creating room:', error);
    res.status(500).json({ message: 'Failed to create room' });
  }
});

router.put('/rooms/:id', async (req: AuthRequest, res: Response) => {
  try {
    const data = roomSchema.partial().parse(req.body);

    if (data.roomNumber) {
      const existingRoom = await Room.findOne({
        roomNumber: data.roomNumber,
        _id: { $ne: req.params.id },
      });
      if (existingRoom) {
        return res.status(400).json({ message: 'Room number already exists' });
      }
    }

    const room = await Room.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(room.toJSON());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    console.error('Error updating room:', error);
    res.status(500).json({ message: 'Failed to update room' });
  }
});

router.delete('/rooms/:id', async (req: AuthRequest, res: Response) => {
  try {
    const activeBookings = await Booking.countDocuments({
      roomId: req.params.id,
      status: { $in: ['pending', 'confirmed', 'checked_in'] },
    });

    if (activeBookings > 0) {
      return res.status(400).json({ message: 'Cannot delete room with active bookings' });
    }

    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ message: 'Failed to delete room' });
  }
});

router.post('/upload', upload.array('images', 5), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const urls = files.map((file) => `/uploads/${file.filename}`);
    res.json({ urls });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ message: 'Failed to upload files' });
  }
});

router.get('/bookings', async (req: AuthRequest, res: Response) => {
  try {
    const { limit = '50' } = req.query;
    
    const bookings = await Booking.find()
      .populate('userId', 'firstName lastName email phone')
      .populate('roomId', 'name roomNumber category images')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

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

router.patch('/bookings/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(booking.toJSON());
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ message: 'Failed to update status' });
  }
});

export default router;
