import mongoose, { Document, Schema, Model } from 'mongoose';

export type PaymentStatus = 'PENDING' | 'SIMULATED_SUCCESS' | 'FAILED';

export interface IPayment extends Document {
  _id: mongoose.Types.ObjectId;
  applicationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string;
  transactionId: string;
  isPrototype?: boolean;
  paymentTimestamp?: Date;
  receiptNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 100,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['PENDING', 'SIMULATED_SUCCESS', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    paymentMethod: {
      type: String,
      default: 'SIMULATED_MOCK_PAYMENT',
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    isPrototype: {
      type: Boolean,
      default: true,
    },
    paymentTimestamp: {
      type: Date,
      default: Date.now,
    },
    receiptNumber: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Payment: Model<IPayment> = mongoose.model<IPayment>('Payment', PaymentSchema);