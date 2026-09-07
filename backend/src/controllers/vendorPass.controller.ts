import { Request, Response, NextFunction } from 'express';
import { VendorPassService } from '../services/vendorPass.service';
import { AppError } from '../utils/appError';
import { VendorPass } from '../models/vendorPass.model';
import { WhatsAppService } from '../services/whatsapp.service';
import { randomBytes } from 'crypto';

export class VendorPassController {
  /** POST /api/v1/vendor-pass/:passId/feedback */
  static async submitFeedback(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const rating = Number(req.body.rating);
      const tags = Array.isArray(req.body.tags)
        ? req.body.tags.filter((tag: unknown): tag is string => typeof tag === 'string')
        : [];
      const comment = typeof req.body.comment === 'string' ? req.body.comment.trim() : undefined;

      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return next(AppError.badRequest('rating must be an integer between 1 and 5'));
      }

      let pass = await VendorPass.findOne({
        $or: [{ passId: req.params.passId }, { passNumber: req.params.passId }],
      });
      if (!pass) {
        try {
          await VendorPassService.verifyPass(req.params.passId);
          pass = await VendorPass.findOne({
            $or: [{ passId: req.params.passId }, { passNumber: req.params.passId }],
          });
        } catch {
          res.status(404).json({ error: 'Vendor pass not found' });
          return;
        }
      }

      if (!pass) {
        res.status(404).json({ error: 'Vendor pass not found' });
        return;
      }

      if (!pass.communityTrust) {
        pass.communityTrust = {
          averageRating: 4.8,
          totalReviews: 14,
          verifiedBadge: true,
          feedbackHistory: [],
        };
      }

      pass.communityTrust.feedbackHistory.push({
        rating,
        tags: tags || [],
        ...(comment ? { comment } : {}),
        submittedAt: new Date(),
      });

      const history = pass.communityTrust.feedbackHistory;
      const sum = history.reduce((acc: number, item: any) => acc + item.rating, 0);
      pass.communityTrust.totalReviews = history.length;
      pass.communityTrust.averageRating = Math.round((sum / history.length) * 10) / 10;
      pass.communityTrust.verifiedBadge = pass.communityTrust.averageRating >= 4.0;

      const targetPhone = '918102098695';
      const notificationMsg = `*FSSAI Seva Kendra — Naya Customer Review!*\n\n⭐ Rating: ${rating}/5 Stars\n🏷️ Tags: ${(tags || []).join(', ') || 'General Hygiene'}${comment ? `\n💬 Comment: "${comment}"` : ''}\n\nAapke thele ko naya review mila hai! Live Pass check karein.`;
      
      pass.latestNotification = {
        title: 'New WhatsApp Customer Review!',
        message: `Aapke thele ko customer ne ${rating}-star rating di hai! Tags: ${(tags || []).join(', ')}`,
        rating,
        tags: tags || [],
        timestamp: new Date(),
        read: false,
      };

      await pass.save();

      // Trigger background automated notification to target phone (Twilio / CallMeBot if configured)
      WhatsAppService.sendAutomatedNotification(targetPhone, notificationMsg).catch((err) =>
        console.warn('[VendorPassController] WhatsApp background dispatch notice:', err)
      );

      const whatsappUrl = WhatsAppService.getClickToChatUrl(targetPhone, notificationMsg);

      res.status(200).json({
        success: true,
        communityTrust: pass.communityTrust,
        notification: pass.latestNotification,
        whatsapp: {
          targetPhone,
          url: whatsappUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /** GET /api/v1/vendor-pass/:passId/notifications */
  static async getLatestNotification(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      let pass = await VendorPass.findOne({ passNumber: req.params.passId });
      if (!pass) {
        try {
          await VendorPassService.verifyPass(req.params.passId);
          pass = await VendorPass.findOne({ passNumber: req.params.passId });
        } catch {}
      }

      if (!pass) {
        res.status(200).json({ success: true, notification: null });
        return;
      }

      res.status(200).json({
        success: true,
        notification: pass.latestNotification,
        communityTrust: pass.communityTrust,
      });
    } catch (error) {
      next(error);
    }
  }

  /** PATCH /api/v1/vendor-pass/:passId/notifications/read */
  static async markNotificationRead(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const pass = await VendorPass.findOne({
        $or: [{ passId: req.params.passId }, { passNumber: req.params.passId }],
      });
      if (pass && pass.latestNotification) {
        pass.latestNotification.read = true;
        await pass.save();
      }

      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  /** POST /api/v1/vendor-pass/:passId/dismiss-notification */
  static async dismissNotification(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const passId = req.params.passId;
      let pass = await VendorPass.findOne({
        $or: [{ passId }, { passNumber: passId }],
      });
      if (!pass) {
        try {
          await VendorPassService.verifyPass(passId);
          pass = await VendorPass.findOne({
            $or: [{ passId }, { passNumber: passId }],
          });
        } catch {}
      }

      if (!pass) {
        res.status(404).json({ error: 'Vendor pass not found' });
        return;
      }

      if (pass.latestNotification) {
        pass.latestNotification.read = true;
        await pass.save();
      }

      res.status(200).json({
        success: true,
        message: 'Notification dismissed',
        latestNotification: pass.latestNotification,
      });
    } catch (error) {
      next(error);
    }
  }

  /** GET /api/v1/system-info */
  static async getSystemInfo(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const os = await import('os');
      const ifaces = os.networkInterfaces();
      let localIp = 'localhost';
      for (const name of Object.keys(ifaces)) {
        for (const net of ifaces[name] || []) {
          if (net.family === 'IPv4' && !net.internal) {
            localIp = net.address;
            break;
          }
        }
      }
      res.status(200).json({ success: true, localIp, port: 3000 });
    } catch (error) {
      next(error);
    }
  }

  /** POST /api/v1/vendor-pass/:passId/simulate-expiry */
  static async simulateExpiry(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) return next(AppError.unauthorized('Authentication required'));

      const pass = await VendorPass.findOne({ passNumber: req.params.passId });
      if (!pass) return next(AppError.notFound('Vendor Pass not found'));
      if (pass.userId.toString() !== req.user._id.toString()) {
        return next(AppError.forbidden('You do not have permission to update this pass'));
      }

      pass.validUntil = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
      pass.renewalStatus = 'DUE_SOON';
      pass.renewalToken = randomBytes(12).toString('hex');
      await pass.save();

      res.status(200).json({
        success: true,
        passId: pass.passNumber,
        renewalToken: pass.renewalToken,
        actionUrl: `/renew/${pass.renewalToken}`,
        message: 'Aapka FSSAI pass 15 din mein expire ho raha hai. Late fee (₹100/din) se bachne ke liye yahan tap karke 1 minute mein renew karein.',
      });
    } catch (error) {
      next(error);
    }
  }

  /** GET /api/v1/vendor-pass/renew/:token */
  static async getRenewalInfo(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const pass = await VendorPass.findOne({ renewalToken: req.params.token });
      if (!pass) {
        res.status(404).json({ error: 'Invalid or expired renewal link' });
        return;
      }

      res.status(200).json({ success: true, pass });
    } catch (error) {
      next(error);
    }
  }

  /** POST /api/v1/vendor-pass/renew/:token */
  static async renewPass(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const pass = await VendorPass.findOne({ renewalToken: req.params.token });
      if (!pass) {
        res.status(404).json({ error: 'Invalid or expired renewal link' });
        return;
      }

      pass.validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      pass.renewalStatus = 'RENEWED';
      pass.lastRenewedAt = new Date();
      pass.renewalToken = undefined;
      await pass.save();

      res.status(200).json({
        success: true,
        passId: pass.passNumber,
        validUntil: pass.validUntil,
        message: 'Pass successfully renewed for 1 year.',
      });
    } catch (error) {
      next(error);
    }
  }
  /**
   * POST /api/v1/applications/:id/pass
   * Generate synthetic Vendor Pass with QR payload
   */
  static async generatePass(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        return next(AppError.unauthorized('Authentication required'));
      }

      const { id } = req.params;
      const result = await VendorPassService.generatePass(
        id,
        req.user._id.toString()
      );

      res.status(200).json({
        success: true,
        message: 'Synthetic Vendor Pass generated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/applications/:id/pass
   * Retrieve pass for an application
   */
  static async getPassForApplication(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        return next(AppError.unauthorized('Authentication required'));
      }

      const { id } = req.params;
      const result = await VendorPassService.getPassForApplication(
        id,
        req.user._id.toString()
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/vendor-pass/:passId
   * Public prototype verification endpoint
   */
  static async verifyPass(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { passId } = req.params;
      if (!passId) {
        return next(AppError.badRequest('passId parameter is required'));
      }

      const result = await VendorPassService.verifyPass(passId);
      const { renewalToken: _renewalToken, ...publicResult } = result;

      res.status(200).json({
        success: true,
        message: 'Prototype pass verified',
        communityTrust: result.communityTrust,
        latestNotification: result.latestNotification,
        pass: {
          passId: result.passId,
          businessName: result.businessName || result.businessType,
          vendingCategory: result.vendingCategory || result.businessType,
          premisesBadge: result.premises
            ? {
                verificationType: result.premises.verificationType,
                wardOrLocation: result.premises.wardNumber || result.premises.landmark,
                isVerified: result.premises.isVerified,
              }
            : undefined,
          hygieneBadge: result.hygiene
            ? {
                passed: result.hygiene.passed,
                confidenceScore: result.hygiene.confidenceScore,
                summary: result.hygiene.summary,
                markers: result.hygiene.markers,
              }
            : undefined,
          status: result.status,
          issuedAt: result.issuedAt,
          validUntil: result.validUntil,
          renewalStatus: result.renewalStatus,
          communityTrust: result.communityTrust,
          latestNotification: result.latestNotification,
        },
        data: {
          ...publicResult,
          communityTrust: result.communityTrust,
          latestNotification: result.latestNotification,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
