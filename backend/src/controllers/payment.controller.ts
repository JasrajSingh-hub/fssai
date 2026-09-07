import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';
import { AppError } from '../utils/appError';

export class PaymentController {
  /**
   * POST /api/v1/applications/:id/payment/simulate
   * Simulates prototype ₹100 payment
   */
  static async simulatePayment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        return next(AppError.unauthorized('Authentication required'));
      }

      const { id } = req.params;

      const result = await PaymentService.simulatePayment(
        id,
        req.user._id.toString()
      );

      res.status(200).json({
        success: true,
        message: 'Prototype payment simulated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}