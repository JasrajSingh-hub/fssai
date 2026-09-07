import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Application } from '../models/application.model';
import { EligibilityService } from '../services/eligibility.service';
import { AppError } from '../utils/appError';
import { randomBytes } from 'crypto';

export class ApplicationController {
  /** POST /api/v1/applications/:id/deficiency */
  static async raiseDeficiency(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) return next(AppError.unauthorized('Authentication required'));

      const application = await Application.findById(req.params.id);
      if (!application) return next(AppError.notFound('Application not found'));
      if (application.userId.toString() !== req.user._id.toString()) {
        return next(AppError.forbidden('You do not have permission to update this application'));
      }

      const remedyToken = randomBytes(12).toString('hex');
      application.status = 'DEFICIENCY_RAISED';
      application.deficiency = {
        code: req.body.code || 'STALL_PHOTO_UNCLEAR',
        officerNotes: 'Covered dustbin not visible in stall photo',
        plainGuidanceHindi: 'Thele ki photo mein covered dustbin saaf nahi dikh raha. Kripya nayi photo bhejein.',
        plainGuidanceEnglish: 'Stall photo missing covered waste bin. Please upload a clear photo.',
        remedyToken,
        status: 'OPEN',
      };
      await application.save();

      res.status(200).json({
        success: true,
        remedyToken,
        actionUrl: `/remedy/${remedyToken}`,
      });
    } catch (error) {
      next(error);
    }
  }

  /** GET /api/v1/applications/remedy/:token */
  static async getRemedy(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const application = await Application.findOne({ 'deficiency.remedyToken': req.params.token });
      if (!application || !application.deficiency) {
        res.status(404).json({ error: 'Invalid or expired remedy link' });
        return;
      }

      res.status(200).json({
        success: true,
        applicationId: application._id,
        businessName: application.businessDetails?.businessName || application.businessDetails?.stallType,
        deficiency: application.deficiency,
      });
    } catch (error) {
      next(error);
    }
  }

  /** POST /api/v1/applications/remedy/:token */
  static async resolveRemedy(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const application = await Application.findOne({ 'deficiency.remedyToken': req.params.token });
      if (!application || !application.deficiency) {
        res.status(404).json({ error: 'Invalid or expired remedy link' });
        return;
      }

      application.status = 'UNDER_REVIEW';
      application.deficiency.status = 'RESOLVED';
      application.deficiency.resolvedAt = new Date();
      application.deficiency.remedyProofUrl = req.body.proofUrl || 'mock_proof_resolved.jpg';
      await application.save();

      res.status(200).json({
        success: true,
        message: 'Deficiency resolved and resubmitted to FSO queue',
      });
    } catch (error) {
      next(error);
    }
  }
  /**
   * GET /api/v1/applications/:id
   * Fetch application by ID for review screen
   */
  static async getApplication(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        return next(AppError.unauthorized('Authentication required'));
      }

      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(AppError.badRequest('Invalid application ID format'));
      }

      const application = await Application.findById(id);
      if (!application) {
        return next(AppError.notFound('Application not found'));
      }

      if (application.userId.toString() !== req.user._id.toString()) {
        return next(AppError.forbidden('You do not have permission to access this application'));
      }

      res.status(200).json({
        success: true,
        data: { application },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/applications/:id
   * Confirm or update AI-extracted business profile
   * Transitions status: AI_PROCESSED / REVIEW_PENDING -> USER_CONFIRMED
   */
  static async confirmBusinessReview(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        return next(AppError.unauthorized('Authentication required'));
      }

      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(AppError.badRequest('Invalid application ID format'));
      }

      const application = await Application.findById(id);
      if (!application) {
        return next(AppError.notFound('Application not found'));
      }

      if (application.userId.toString() !== req.user._id.toString()) {
        return next(AppError.forbidden('You do not have permission to update this application'));
      }

      const {
        kind_of_business,
        food_categories,
        business_description,
        annual_turnover_estimated,
      } = req.body;

      application.businessDetails = {
        ...application.businessDetails,
        stallType: kind_of_business,
        foodCategory: food_categories,
        annualTurnoverEstimated:
          annual_turnover_estimated ?? application.businessDetails?.annualTurnoverEstimated,
      };

      application.status = 'USER_CONFIRMED';
      await application.save();

      res.status(200).json({
        success: true,
        message: 'Business review confirmed successfully',
        data: {
          applicationId: application._id.toString(),
          status: application.status,
          businessDetails: application.businessDetails,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/applications/:id/check-eligibility
   * Deterministic prototype eligibility engine
   * Transitions status: USER_CONFIRMED -> ELIGIBILITY_CHECKED
   */
  static async checkEligibility(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        return next(AppError.unauthorized('Authentication required'));
      }

      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(AppError.badRequest('Invalid application ID format'));
      }

      const application = await Application.findById(id);
      if (!application) {
        return next(AppError.notFound('Application not found'));
      }

      if (application.userId.toString() !== req.user._id.toString()) {
        return next(AppError.forbidden('You do not have permission to access this application'));
      }

      // Verify that the application has confirmed business data
      const confirmedStatuses = ['USER_CONFIRMED', 'ELIGIBILITY_CHECKED', 'COMPLETED'];
      if (!confirmedStatuses.includes(application.status)) {
        return next(
          AppError.badRequest(
            'Cannot evaluate eligibility: Business information must be reviewed and confirmed first.'
          )
        );
      }

      // Run deterministic eligibility rules engine
      const eligibilityResult = EligibilityService.evaluate({
        kind_of_business: application.businessDetails?.stallType,
        food_categories: application.businessDetails?.foodCategory,
        annual_turnover_estimated: application.businessDetails?.annualTurnoverEstimated,
      });

      // Save eligibility results
      application.eligibility = {
        path: eligibilityResult.path,
        fee: eligibilityResult.fee,
        currency: eligibilityResult.currency,
        isPrototype: eligibilityResult.isPrototype,
        message: eligibilityResult.message,
        disclaimer: eligibilityResult.disclaimer,
        criteriaNotes: eligibilityResult.criteriaNotes,
        checkedAt: new Date(),
      };

      application.status = 'ELIGIBILITY_CHECKED';
      await application.save();

      res.status(200).json({
        success: true,
        data: {
          applicationId: application._id.toString(),
          eligibility: {
            path: eligibilityResult.path,
            fee: eligibilityResult.fee,
            currency: eligibilityResult.currency,
            isPrototype: eligibilityResult.isPrototype,
            message: eligibilityResult.message,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/applications/:id/premises
   * Save premises verification chosen by the vendor
   */
  static async updatePremisesVerification(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        return next(AppError.unauthorized('Authentication required'));
      }

      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(AppError.badRequest('Invalid application ID format'));
      }

      const application = await Application.findById(id);
      if (!application) {
        return next(AppError.notFound('Application not found'));
      }

      if (application.userId.toString() !== req.user._id.toString()) {
        return next(AppError.forbidden('You do not have permission to update this application'));
      }

      const legacyTypeMap: Record<string, 'TVC_CERTIFICATE' | 'PM_SVANIDHI' | 'GEOTAG_FALLBACK'> = {
        tvc: 'TVC_CERTIFICATE',
        pmsvanidhi: 'PM_SVANIDHI',
        geo_fallback: 'GEOTAG_FALLBACK',
      };
      const verificationType =
        req.body.verificationType || legacyTypeMap[req.body.type as string];

      if (!verificationType) {
        return next(AppError.badRequest('Verification type is required'));
      }

      const rawCoordinates = req.body.coordinates;
      const coordinates = Array.isArray(rawCoordinates)
        ? { latitude: rawCoordinates[0], longitude: rawCoordinates[1] }
        : rawCoordinates;

      application.premises = {
        verificationType,
        tvcCertificateNumber: req.body.tvcCertificateNumber || req.body.tvcId,
        wardNumber: req.body.wardNumber || req.body.ward,
        issuingMunicipality: req.body.issuingMunicipality,
        loanApplicationNumber: req.body.loanApplicationNumber || req.body.tvcId,
        coordinates,
        landmark:
          req.body.landmark ||
          req.body.wardNumber ||
          req.body.ward ||
          (verificationType === 'GEOTAG_FALLBACK' ? 'Geo-tagged vending spot' : undefined),
        verifiedAt: new Date(),
        isVerified: true,
      };

      application.premisesVerification = {
        type: verificationType,
        tvcId: application.premises.tvcCertificateNumber || application.premises.loanApplicationNumber,
        ward: application.premises.wardNumber || application.premises.landmark,
        coordinates:
          coordinates?.latitude !== undefined && coordinates?.longitude !== undefined
            ? [coordinates.latitude, coordinates.longitude]
            : undefined,
      };
      await application.save();

      res.status(200).json({
        success: true,
        data: {
          applicationId: application._id.toString(),
          application,
          premises: application.premises,
          premisesVerification: application.premisesVerification,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
