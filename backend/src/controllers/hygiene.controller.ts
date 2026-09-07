import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Application } from '../models/application.model';
import { AIService } from '../services/ai.service';
import { HygieneService } from '../services/hygiene.service';
import { AppError } from '../utils/appError';

export class HygieneController {
  /**
   * POST /api/v1/hygiene/scan-stall
   * Analyze a stall/preparation-area image for Schedule 4 hygiene markers.
   */
  static async scanStall(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await AIService.analyzeStallSanitation(
        req.body.imageBase64,
        req.body.clientContext
      );

      res.status(200).json({
        success: true,
        message: result.isMock
          ? 'Mock sanitation audit completed'
          : 'AI sanitation audit completed',
        data: {
          ...result.data,
          source: result.isMock ? 'mock' : 'openai',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/applications/:id/hygiene
   * Retrieve controlled hygiene checklist for verified application
   */
  static async getChecklist(
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

      const result = HygieneService.getChecklist(application);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/applications/:id/hygiene
   * Submit completed checklist item IDs
   */
  static async completeChecklist(
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

      const result = await HygieneService.completeChecklist(
        application,
        req.body
      );

      res.status(200).json({
        success: true,
        message: 'Hygiene checklist completed successfully',
        data: {
          ...result,
          application,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/applications/:id/document
   * Attach confirmed synthetic document/photo
   */
  static async uploadDocument(
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

      const result = await HygieneService.saveSyntheticDocument(
        application,
        req.body
      );

      res.status(200).json({
        success: true,
        message: 'Synthetic document recorded successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
