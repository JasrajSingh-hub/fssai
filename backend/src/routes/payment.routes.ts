import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { applicationIdParamSchema } from '../validators/application.validator';

const router = Router();

// POST /api/v1/applications/:id/payment/simulate
router.post(
  '/:id/payment/simulate',
  authenticate,
  validate(applicationIdParamSchema),
  PaymentController.simulatePayment
);

export default router;