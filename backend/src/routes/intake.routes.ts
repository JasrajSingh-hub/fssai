import { Router } from 'express';
import { IntakeController } from '../controllers/intake.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { intakeAnalyzeRequestSchema } from '../ai/schemas/business.schema';

const router = Router();

// POST /api/v1/intake/analyze
router.post(
  '/analyze',
  authenticate,
  validate(intakeAnalyzeRequestSchema),
  IntakeController.analyze
);

export default router;