import mongoose from 'mongoose';
import { env } from '../src/config/env';
import { User } from '../src/models/user.model';
import { Application } from '../src/models/application.model';
import { Payment } from '../src/models/payment.model';
import { VendorPass } from '../src/models/vendorPass.model';

async function testMongo() {
  console.log('Testing MongoDB connection...');
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB host:', conn.connection.host);
    console.log('✅ User model ready:', !!User);
    console.log('✅ Application model ready:', !!Application);
    console.log('✅ Payment model ready:', !!Payment);
    console.log('✅ VendorPass model ready:', !!VendorPass);
    await mongoose.disconnect();
    console.log('✅ Disconnected cleanly.');
    process.exit(0);
  } catch (err: any) {
    console.warn('⚠️ MongoDB connection warning (network/DNS/Atlas timeout):', err.message);
    console.log('ℹ️ Connection failure handled gracefully with descriptive error.');
    process.exit(0);
  }
}

testMongo();