import mongoose from 'mongoose';
import { Application, IApplication } from '../models/application.model';
import { Payment, IPayment } from '../models/payment.model';
import { AppError } from '../utils/appError';

export class PaymentService {
  /**
   * Simulates prototype ₹100 fee payment.
   * NOTE: This is purely a deterministic simulation for hackathon demo.
   * No actual bank, gateway, or payment provider is contacted.
   */
  static async simulatePayment(
    applicationId: string,
    userId: string
  ): Promise<{
    paymentId: string;
    amount: number;
    currency: string;
    status: string;
    isPrototype: boolean;
    transactionId: string;
  }> {
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      throw AppError.badRequest('Invalid application ID format');
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      throw AppError.notFound('Application not found');
    }

    // Verify application belongs to authenticated user
    if (application.userId.toString() !== userId) {
      throw AppError.forbidden('You do not have permission to pay for this application');
    }

    // Verify application reached HYGIENE_GENERATED
    const allowedPriorStatuses = [
      'HYGIENE_GENERATED',
    ];

    const alreadyPaidStatuses = [
      'PAYMENT_SIMULATED',
      'PASS_GENERATED',
      'COMPLETED',
    ];

    if (alreadyPaidStatuses.includes(application.status)) {
      throw AppError.badRequest('Payment has already been simulated for this application');
    }

    if (!allowedPriorStatuses.includes(application.status)) {
      throw AppError.badRequest(
        'Cannot initiate payment: Hygiene checklist and document steps must be completed first.'
      );
    }

    // Check if duplicate payment record already exists
    const existingPayment = await Payment.findOne({
      applicationId: application._id,
      status: 'SIMULATED_SUCCESS',
    });

    if (existingPayment) {
      throw AppError.badRequest('A successful simulated payment already exists for this application');
    }

    // Fee is strictly determined by backend configuration (turnover rule: ₹100)
    const amount = application.eligibility?.fee ?? 100;
    const currency = application.eligibility?.currency || 'INR';

    const transactionId = `SIM-PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const receiptNumber = `REC-MOCK-${Date.now().toString().slice(-6)}`;

    const payment = await Payment.create({
      applicationId: application._id,
      userId: new mongoose.Types.ObjectId(userId),
      amount,
      currency,
      status: 'SIMULATED_SUCCESS',
      paymentMethod: 'SIMULATED_MOCK_PAYMENT',
      transactionId,
      receiptNumber,
      isPrototype: true,
      paymentTimestamp: new Date(),
    });

    // Update application status to PAYMENT_SIMULATED
    application.status = 'PAYMENT_SIMULATED';
    await application.save();

    return {
      paymentId: payment._id.toString(),
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      isPrototype: true,
      transactionId: payment.transactionId,
    };
  }
}