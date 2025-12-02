import mongoose from "mongoose";
import { User, Room, Booking, Review } from "../db/models/index.js";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI!;

const sampleRooms = [
  {
    name: "Presidential Suite",
    description: "Our most luxurious accommodation featuring a private terrace with panoramic ocean views, a master bedroom with king-size bed, separate living area, marble bathroom with jacuzzi, and 24-hour butler service. Perfect for those seeking the ultimate in comfort and elegance.",
    category: "Presidential",
    pricePerNight: 899,
    capacity: 4,
    roomNumber: "PH01",
    images: [
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800"
    ],
    amenities: ["WiFi", "Air Conditioning", "Ocean View", "Mini Bar", "Room Service", "Jacuzzi", "Private Terrace", "Butler Service"],
    isAvailable: true
  },
  {
    name: "Deluxe Ocean View",
    description: "Wake up to stunning sunrise views over the Pacific Ocean. This spacious room features a plush king-size bed, floor-to-ceiling windows, modern bathroom with rain shower, and a private balcony. Ideal for couples seeking a romantic getaway.",
    category: "Deluxe",
    pricePerNight: 399,
    capacity: 2,
    roomNumber: "301",
    images: [
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800"
    ],
    amenities: ["WiFi", "Air Conditioning", "Ocean View", "Mini Bar", "Balcony", "Rain Shower"],
    isAvailable: true
  },
  {
    name: "Garden Executive Suite",
    description: "A private suite surrounded by tropical gardens, featuring two bedrooms, a private pool, outdoor dining area, and a fully equipped kitchen. Perfect for families or groups looking for privacy and space.",
    category: "Executive",
    pricePerNight: 649,
    capacity: 6,
    roomNumber: "V01",
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800"
    ],
    amenities: ["WiFi", "Air Conditioning", "Private Pool", "Kitchen", "Garden View", "BBQ Area", "Outdoor Dining"],
    isAvailable: true
  },
  {
    name: "Classic Double Room",
    description: "Comfortable and elegantly appointed room featuring two queen-size beds, work desk, and modern amenities. An excellent choice for business travelers or friends traveling together.",
    category: "Standard",
    pricePerNight: 199,
    capacity: 4,
    roomNumber: "102",
    images: [
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800"
    ],
    amenities: ["WiFi", "Air Conditioning", "Work Desk", "Coffee Maker", "Iron"],
    isAvailable: true
  },
  {
    name: "Executive Business Suite",
    description: "Designed for the discerning business traveler, this suite offers a separate living room, executive work area, premium toiletries, and access to our exclusive Executive Lounge with complimentary refreshments.",
    category: "Executive",
    pricePerNight: 499,
    capacity: 2,
    roomNumber: "401",
    images: [
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800",
      "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800"
    ],
    amenities: ["WiFi", "Air Conditioning", "Executive Lounge Access", "Mini Bar", "Work Desk", "City View", "Nespresso Machine"],
    isAvailable: true
  },
  {
    name: "Beachfront Deluxe",
    description: "Step directly onto the sand from your private room. Features a king-size canopy bed, outdoor shower, hammock, and direct beach access. The perfect retreat for beach lovers.",
    category: "Deluxe",
    pricePerNight: 549,
    capacity: 2,
    roomNumber: "B01",
    images: [
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
      "https://images.unsplash.com/photo-1439130490301-25e322d88054?w=800"
    ],
    amenities: ["WiFi", "Air Conditioning", "Beach Access", "Outdoor Shower", "Hammock", "Ocean View"],
    isAvailable: true
  },
  {
    name: "Family Suite",
    description: "Spacious two-room suite designed for families. Features a master bedroom with king bed, kids' room with bunk beds, large bathroom, and a living area with entertainment system. Kids' welcome amenities included.",
    category: "Family",
    pricePerNight: 449,
    capacity: 5,
    roomNumber: "205",
    images: [
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800"
    ],
    amenities: ["WiFi", "Air Conditioning", "Mini Bar", "Kids' Amenities", "Gaming Console", "Extra Beds Available"],
    isAvailable: true
  },
  {
    name: "Penthouse Loft",
    description: "Contemporary two-story loft with floor-to-ceiling windows offering 360-degree city views. Features a spiral staircase, rooftop terrace, designer furniture, and a state-of-the-art entertainment system.",
    category: "Penthouse",
    pricePerNight: 1299,
    capacity: 4,
    roomNumber: "PH02",
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"
    ],
    amenities: ["WiFi", "Air Conditioning", "City View", "Rooftop Terrace", "Home Theater", "Wine Cellar", "Private Elevator"],
    isAvailable: true
  },
  {
    name: "Cozy Single Room",
    description: "Perfect for solo travelers, this compact but comfortable room offers everything you need for a pleasant stay. Features a queen-size bed, workspace, and modern bathroom.",
    category: "Standard",
    pricePerNight: 129,
    capacity: 1,
    roomNumber: "105",
    images: [
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800"
    ],
    amenities: ["WiFi", "Air Conditioning", "Work Desk", "Coffee Maker"],
    isAvailable: true
  },
  {
    name: "Spa Retreat Room",
    description: "Wellness-focused room featuring an in-room jacuzzi, aromatherapy amenities, yoga mat, and complimentary spa credits. Designed for ultimate relaxation and rejuvenation.",
    category: "Deluxe",
    pricePerNight: 379,
    capacity: 2,
    roomNumber: "SPA01",
    images: [
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800"
    ],
    amenities: ["WiFi", "Air Conditioning", "In-Room Jacuzzi", "Spa Credits", "Yoga Mat", "Aromatherapy", "Meditation Corner"],
    isAvailable: true
  }
];

const reviewTexts = [
  { rating: 5, text: "Absolutely stunning room with breathtaking views! The staff was incredibly attentive and made our anniversary truly special. Will definitely be returning!" },
  { rating: 5, text: "Best hotel experience we've ever had. The room was immaculate, the bed was heavenly, and the amenities exceeded our expectations." },
  { rating: 4, text: "Great location and beautiful room. The only minor issue was slow WiFi during peak hours, but otherwise perfect." },
  { rating: 5, text: "The attention to detail is remarkable. From the welcome amenities to the turndown service, everything was perfect." },
  { rating: 4, text: "Lovely room with great ocean views. The balcony was perfect for morning coffee. Would recommend to friends." },
  { rating: 5, text: "Exceeded all expectations! The room was spacious, clean, and beautifully decorated. The breakfast was also fantastic." },
  { rating: 4, text: "Very comfortable stay. The bed was extremely comfortable and the room was quiet despite being near the elevator." },
  { rating: 5, text: "We celebrated our honeymoon here and it was magical. The staff arranged flowers and champagne as a surprise!" },
  { rating: 3, text: "Good room overall, but the air conditioning was a bit noisy. Location and service were excellent though." },
  { rating: 5, text: "Perfect for a business trip. The work desk was spacious, WiFi was fast, and the executive lounge was a nice touch." }
];

const guestNames = [
  "Sarah Mitchell", "James Wilson", "Emily Chen", "Michael Brown", 
  "Jessica Taylor", "David Lee", "Amanda Johnson", "Robert Garcia",
  "Jennifer Martinez", "Christopher Anderson"
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Create sample customers if they don't exist
    const customers = [];
    for (let i = 0; i < 5; i++) {
      const email = `customer${i + 1}@example.com`;
      let customer = await User.findOne({ email });
      if (!customer) {
        const hashedPassword = await bcrypt.hash("password123", 10);
        customer = await User.create({
          firstName: guestNames[i].split(" ")[0],
          lastName: guestNames[i].split(" ")[1],
          email,
          password: hashedPassword,
          role: "customer"
        });
        console.log(`Created customer: ${email}`);
      }
      customers.push(customer);
    }

    // Create rooms (skip if already exists by roomNumber)
    const createdRooms = [];
    for (const roomData of sampleRooms) {
      let room = await Room.findOne({ roomNumber: roomData.roomNumber });
      if (!room) {
        room = await Room.create(roomData);
        console.log(`Created room: ${room.name}`);
      }
      createdRooms.push(room);
    }

    // Create sample bookings with various statuses
    const bookingStatuses = ["pending", "confirmed", "checked-in", "checked-out", "cancelled"];
    const today = new Date();
    
    // Past bookings (checked_out)
    for (let i = 0; i < 5; i++) {
      const room = createdRooms[i % createdRooms.length];
      const customer = customers[i % customers.length];
      const checkIn = new Date(today);
      checkIn.setDate(today.getDate() - 30 + (i * 5));
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkIn.getDate() + 2 + (i % 3));
      
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      
      const existingBooking = await Booking.findOne({ 
        roomId: room._id, 
        userId: customer._id,
        checkInDate: checkIn 
      });
      
      if (!existingBooking) {
        const booking = await Booking.create({
          userId: customer._id,
          roomId: room._id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          totalPrice: room.pricePerNight * nights,
          status: "checked_out",
          guestCount: Math.min(2, room.capacity),
          specialRequests: i % 2 === 0 ? "Late check-out requested" : undefined,
          paymentStatus: "paid"
        });
        console.log(`Created past booking for ${room.name}`);

        // Add review for checked_out bookings
        const reviewData = reviewTexts[i % reviewTexts.length];
        await Review.create({
          userId: customer._id,
          roomId: room._id,
          bookingId: booking._id,
          rating: reviewData.rating,
          comment: reviewData.text
        });
        console.log(`Created review for ${room.name}`);
      }
    }

    // Current bookings (confirmed, checked_in)
    for (let i = 0; i < 3; i++) {
      const room = createdRooms[(i + 5) % createdRooms.length];
      const customer = customers[(i + 2) % customers.length];
      const checkIn = new Date(today);
      checkIn.setDate(today.getDate() - 1);
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkIn.getDate() + 3);
      
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      
      const existingBooking = await Booking.findOne({ 
        roomId: room._id, 
        status: { $in: ["confirmed", "checked_in"] }
      });
      
      if (!existingBooking) {
        await Booking.create({
          userId: customer._id,
          roomId: room._id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          totalPrice: room.pricePerNight * nights,
          status: i === 0 ? "checked_in" : "confirmed",
          guestCount: Math.min(2, room.capacity),
          paymentStatus: "paid"
        });
        console.log(`Created current booking for ${room.name} (${i === 0 ? "checked_in" : "confirmed"})`);
      }
    }

    // Future bookings (pending)
    for (let i = 0; i < 4; i++) {
      const room = createdRooms[(i + 3) % createdRooms.length];
      const customer = customers[i % customers.length];
      const checkIn = new Date(today);
      checkIn.setDate(today.getDate() + 7 + (i * 3));
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkIn.getDate() + 2 + (i % 4));
      
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      
      const existingBooking = await Booking.findOne({ 
        roomId: room._id, 
        checkInDate: checkIn 
      });
      
      if (!existingBooking) {
        await Booking.create({
          userId: customer._id,
          roomId: room._id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          totalPrice: room.pricePerNight * nights,
          status: i % 2 === 0 ? "pending" : "confirmed",
          guestCount: Math.min(2, room.capacity),
          specialRequests: i === 1 ? "Anniversary celebration - please arrange flowers" : undefined,
          paymentStatus: i % 2 === 0 ? "pending" : "paid"
        });
        console.log(`Created future booking for ${room.name}`);
      }
    }

    // One cancelled booking
    const cancelledRoom = createdRooms[7];
    const cancelledCustomer = customers[4];
    const cancelCheckIn = new Date(today);
    cancelCheckIn.setDate(today.getDate() + 14);
    const cancelCheckOut = new Date(cancelCheckIn);
    cancelCheckOut.setDate(cancelCheckIn.getDate() + 3);
    
    const existingCancelled = await Booking.findOne({ 
      roomId: cancelledRoom._id, 
      status: "cancelled" 
    });
    
    if (!existingCancelled) {
      await Booking.create({
        userId: cancelledCustomer._id,
        roomId: cancelledRoom._id,
        checkInDate: cancelCheckIn,
        checkOutDate: cancelCheckOut,
        totalPrice: cancelledRoom.pricePerNight * 3,
        status: "cancelled",
        guestCount: 2,
        paymentStatus: "refunded"
      });
      console.log(`Created cancelled booking for ${cancelledRoom.name}`);
    }

    // Update room average ratings based on reviews
    const rooms = await Room.find();
    for (const room of rooms) {
      const reviews = await Review.find({ room: room._id });
      if (reviews.length > 0) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        await Room.findByIdAndUpdate(room._id, { averageRating: Math.round(avgRating * 10) / 10 });
        console.log(`Updated average rating for ${room.name}: ${avgRating.toFixed(1)}`);
      }
    }

    console.log("\nSeeding complete!");
    console.log(`Total rooms: ${await Room.countDocuments()}`);
    console.log(`Total bookings: ${await Booking.countDocuments()}`);
    console.log(`Total reviews: ${await Review.countDocuments()}`);
    console.log(`Total users: ${await User.countDocuments()}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

seed();
