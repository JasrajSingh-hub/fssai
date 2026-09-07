import { Router } from 'express';
import { ApplicationController } from '../controllers/application.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  confirmBusinessReviewSchema,
  applicationIdParamSchema,
  premisesVerificationSchema,
  deficiencyParamSchema,
  remedyTokenParamSchema,
  resolveRemedySchema,
} from '../validators/application.validator';

const router = Router();

router.get(
  '/remedy/:token',
  validate(remedyTokenParamSchema),
  ApplicationController.getRemedy
);

router.post(
  '/remedy/:token',
  validate(resolveRemedySchema),
  ApplicationController.resolveRemedy
);

router.post(
  '/:id/deficiency',
  authenticate,
  validate(deficiencyParamSchema),
  ApplicationController.raiseDeficiency
);

// GET /api/v1/applications/:id
router.get(
  '/:id',
  authenticate,
  validate(applicationIdParamSchema),
  ApplicationController.getApplication
);

// PATCH /api/v1/applications/:id (Confirm or edit AI-extracted business review)
router.patch(
  '/:id',
  authenticate,
  validate(confirmBusinessReviewSchema),
  ApplicationController.confirmBusinessReview
);

// PATCH /api/v1/applications/:id/premises (Save premises verification)
router.patch(
  '/:id/premises',
  authenticate,
  validate(premisesVerificationSchema),
  ApplicationController.updatePremisesVerification
);

// POST /api/v1/applications/:id/check-eligibility (Deterministic eligibility check)
router.post(
  '/:id/check-eligibility',
  authenticate,
  validate(applicationIdParamSchema),
  ApplicationController.checkEligibility
);

export default router;
