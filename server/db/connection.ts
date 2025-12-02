import mongoose from 'mongoose';

let isConnected = false;

export async function connectToDatabase() {
  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    console.warn('MONGODB_URI not set - MongoDB features will not be available');
    console.warn('Please set the MONGODB_URI environment variable to connect to MongoDB');
    return null;
  }

  try {
    if (mongoose.connection.readyState === 1) {
      console.log('Already connected to MongoDB');
      isConnected = true;
      return mongoose.connection;
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');
    isConnected = true;
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    isConnected = false;
    return null;
  }
}

export function isMongoConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

export { mongoose };
