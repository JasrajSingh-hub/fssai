import { Router } from 'express';
import { HygieneController } from '../controllers/hygiene.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { applicationIdParamSchema } from '../validators/application.validator';
import {
  completeHygieneSchema,
  uploadDocumentSchema,
} from '../validators/hygiene.validator';

const router = Router();

// GET /api/v1/applications/:id/hygiene
router.get(
  '/:id/hygiene',
  authenticate,
  validate(applicationIdParamSchema),
  HygieneController.getChecklist
);

// PATCH /api/v1/applications/:id/hygiene
router.patch(
  '/:id/hygiene',
  authenticate,
  validate(completeHygieneSchema),
  HygieneController.completeChecklist
);

// POST /api/v1/applications/:id/document
router.post(
  '/:id/document',
  authenticate,
  validate(uploadDocumentSchema),
  HygieneController.uploadDocument
);

export default router;