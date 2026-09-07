import { Router } from 'express';
import { HygieneController } from '../controllers/hygiene.controller';
import { validate } from '../middleware/validate.middleware';
import { scanStallSchema } from '../validators/hygiene.validator';

const router = Router();

// POST /api/v1/hygiene/scan-stall
router.post(
  '/scan-stall',
  validate(scanStallSchema),
  HygieneController.scanStall
);

export default router;
