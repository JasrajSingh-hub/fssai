import { Router } from 'express';
import { VendorPassController } from '../controllers/vendorPass.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { applicationIdParamSchema } from '../validators/application.validator';

const router = Router();

// POST /api/v1/applications/:id/pass (generate pass)
router.post(
  '/:id/pass',
  authenticate,
  validate(applicationIdParamSchema),
  VendorPassController.generatePass
);

// GET /api/v1/applications/:id/pass (get pass for application)
router.get(
  '/:id/pass',
  authenticate,
  validate(applicationIdParamSchema),
  VendorPassController.getPassForApplication
);

export default router;