import { Request, Response, NextFunction } from 'express';
import { VendorPassController } from './vendorPass.controller';

export class PassController {
  static submitFeedback = VendorPassController.submitFeedback;
  static getLatestNotification = VendorPassController.getLatestNotification;
  static markNotificationRead = VendorPassController.markNotificationRead;
  static dismissNotification = VendorPassController.dismissNotification;
  static verifyPass = VendorPassController.verifyPass;
  static getSystemInfo = VendorPassController.getSystemInfo;
  static getRenewalInfo = VendorPassController.getRenewalInfo;
  static renewPass = VendorPassController.renewPass;
  static simulateExpiry = VendorPassController.simulateExpiry;
  static generatePass = VendorPassController.generatePass;
  static getPassForApplication = VendorPassController.getPassForApplication;
}

export { VendorPassController };
export default PassController;
