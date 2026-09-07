import { Router } from 'express';
import authRoutes from './auth.routes';
import intakeRoutes from './intake.routes';
import applicationRoutes from './application.routes';
import hygieneRoutes from './hygiene.routes';
import hygieneScanRoutes from './hygieneScan.routes';
import paymentRoutes from './payment.routes';
import vendorPassRoutes from './vendorPass.routes';
import { VendorPassController } from '../controllers/vendorPass.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'StreetSanitation & VendorPass API',
    version: '1.0.0',
  });
});

router.use('/auth', authRoutes);
router.use('/intake', intakeRoutes);
router.use('/hygiene', hygieneScanRoutes);
router.use('/applications', applicationRoutes);
router.use('/applications', hygieneRoutes);
router.use('/applications', paymentRoutes);
router.use('/applications', vendorPassRoutes);

// Public renewal endpoints
router.get('/vendor-pass/renew/:token', VendorPassController.getRenewalInfo);
router.post('/vendor-pass/renew/:token', VendorPassController.renewPass);

// System & network info (for mobile QR discovery across physical devices)
router.get('/system-info', VendorPassController.getSystemInfo);

// Public community trust & feedback endpoint
router.post('/vendor-pass/:passId/feedback', VendorPassController.submitFeedback);

// Real-time vendor notification polling & dismiss
router.get('/vendor-pass/:passId/notifications', VendorPassController.getLatestNotification);
router.patch('/vendor-pass/:passId/notifications/read', VendorPassController.markNotificationRead);
router.post('/vendor-pass/:passId/dismiss-notification', VendorPassController.dismissNotification);

// Public prototype verification endpoint
router.get('/vendor-pass/:passId', VendorPassController.verifyPass);

// Authenticated demo trigger for the vendor's own pass
router.post('/vendor-pass/:passId/simulate-expiry', authenticate, VendorPassController.simulateExpiry);

export default router;
