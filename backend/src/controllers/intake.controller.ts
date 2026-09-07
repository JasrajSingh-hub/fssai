import { Request, Response, NextFunction } from 'express';
import { IntakeService } from '../services/intake.service';
import { AppError } from '../utils/appError';

export class IntakeController {
  static async analyze(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        return next(AppError.unauthorized('User must be authenticated'));
      }

      const transcript = req.body.transcript || req.body.rawTranscript;
      const { applicationId } = req.body;

      const result = await IntakeService.analyzeAndSave(
        req.user._id.toString(),
        transcript,
        applicationId
      );

      res.status(200).json({
        success: true,
        data: {
          applicationId: result.applicationId,
          business: result.business,
          ...(result.isMock && { _meta: { mockMode: true, message: 'Processed using dev fallback parser' } }),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}