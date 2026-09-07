import mongoose from 'mongoose';
import { env } from './env';

export const connectDatabase = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`✅ MongoDB Connected to database: ${mongoose.connection.name}`);
  } catch (error: any) {
    console.warn(`⚠️  MongoDB connection warning: ${error.message}`);
    console.warn(`💡 Ensure MongoDB is running locally or set MONGODB_URI in backend/.env`);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});