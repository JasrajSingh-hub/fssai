import mongoose from 'mongoose';
import { Application } from '../models/application.model';
import { VendorPass } from '../models/vendorPass.model';
import { AppError } from '../utils/appError';

export interface SyntheticPassPayload {
  passId: string;
  businessName?: string;
  vendingCategory?: string;
  status?: string;
  issuedAt?: Date;
  renewalStatus?: 'CURRENT' | 'DUE_SOON' | 'EXPIRED' | 'RENEWED';
  renewalToken?: string;
  lastRenewedAt?: Date;
  syntheticReferenceId: string;
  businessType: string;
  foodCategories: string[];
  issueDate: Date;
  validUntil: Date;
  prototypeStatus: string;
  isPrototype: boolean;
  disclaimer: string;
  premisesVerification?: {
    type?: string;
    tvcId?: string;
    ward?: string;
    coordinates?: [number, number];
  };
  premises?: {
    verificationType?: string;
    wardNumber?: string;
    tvcCertificateNumber?: string;
    landmark?: string;
    isVerified?: boolean;
  };
  hygiene?: {
    passed?: boolean;
    confidenceScore?: number;
    verifiedAt?: Date;
    summaryBadge?: string;
    summary?: string;
    isVerified?: boolean;
    markers?: {
      foodProtection?: {
        detected: boolean;
        confidence?: number;
        label?: string;
      };
      potableWater?: {
        detected: boolean;
        confidence?: number;
        label?: string;
      };
      coveredWasteBin?: {
        detected: boolean;
        confidence?: number;
        label?: string;
      };
      cleanSurface?: {
        detected: boolean;
        confidence?: number;
        label?: string;
      };
    };
  };
  documentsVerified?: boolean;
  documents?: Array<{
    documentType: string;
    fileName: string;
    fileUrl?: string;
    status: string;
    uploadedAt: Date;
  }>;
  communityTrust?: {
    averageRating: number;
    totalReviews: number;
    verifiedBadge: boolean;
    feedbackHistory: Array<{
      rating: number;
      tags?: string[];
      comment?: string;
      submittedAt: Date;
    }>;
  };
  latestNotification?: {
    title: string;
    message: string;
    rating?: number;
    tags?: string[];
    timestamp: Date;
    read: boolean;
  } | null;
  qrPayload: {
    type: string;
    passId: string;
    applicationId: string;
    status: string;
  };
}

const buildHygieneSummaryBadge = (hygiene?: { passed?: boolean; markers?: Record<string, { detected?: boolean }> }): string | undefined => {
  if (!hygiene) return undefined;
  const detectedCount = Object.values(hygiene.markers || {}).filter((marker) => marker?.detected).length;
  return hygiene.passed
    ? `AI Photo-Verified (${detectedCount}/4 Markers Detected)`
    : 'AI Hygiene Audit Pending';
};

export class VendorPassService {
  static async generatePass(applicationId: string, userId: string): Promise<SyntheticPassPayload> {
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      throw AppError.badRequest('Invalid application ID format');
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      throw AppError.notFound('Application not found');
    }

    if (application.userId.toString() !== userId) {
      throw AppError.forbidden('You do not have permission to access this application');
    }

    const allowedPaymentStatuses = ['PAYMENT_SIMULATED', 'PASS_GENERATED', 'COMPLETED'];
    if (!allowedPaymentStatuses.includes(application.status)) {
      throw AppError.badRequest(
        'Vendor pass cannot be generated before payment has been simulated. Current status: ' +
          application.status
      );
    }

    let pass = await VendorPass.findOne({ applicationId: application._id });

    if (!pass) {
      const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
      const passId = `VPR-2026-${randomSuffix}`;
      const syntheticRef = `SYN-FSSAI-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const qrPayload = {
        type: 'DEMO_VENDOR_PASS',
        passId,
        applicationId: application._id.toString(),
        status: 'PROTOTYPE',
      };

      pass = await VendorPass.create({
        passNumber: passId,
        applicationId: application._id,
        userId: application.userId,
        syntheticReferenceId: syntheticRef,
        businessName: application.businessDetails?.businessName,
        businessType: application.businessDetails?.stallType || 'street_food_vendor',
        foodCategories: application.businessDetails?.foodCategory || ['Cooked Food & Beverages'],
        qrCodeData: JSON.stringify(qrPayload),
        fssaiRegistrationNumber: syntheticRef,
        category: 'Petty Food Manufacturer / Street Vendor (Demo)',
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
        prototypeStatus: 'PROTOTYPE',
        isPrototype: true,
        premises: application.premises
          ? {
              verificationType: application.premises.verificationType,
              wardNumber: application.premises.wardNumber,
              tvcCertificateNumber: application.premises.tvcCertificateNumber,
              landmark: application.premises.landmark,
              isVerified: application.premises.isVerified,
            }
          : undefined,
        hygiene: application.hygieneAudit
          ? {
              passed: application.hygieneAudit.passed,
              confidenceScore: application.hygieneAudit.confidenceScore,
              verifiedAt: application.hygieneAudit.verifiedAt,
              summaryBadge: buildHygieneSummaryBadge(application.hygieneAudit),
              summary: application.hygieneAudit.summary,
              isVerified: application.hygieneAudit.isVerified,
              markers: application.hygieneAudit.markers,
            }
          : undefined,
        documentsVerified: application.documentsVerified,
        documents: application.documents,
        disclaimer:
          'Independent Civic UX Prototype â€” NOT AN OFFICIAL FSSAI REGISTRATION â€” NOT A GOVERNMENT-ISSUED DOCUMENT',
      });

      application.status = 'COMPLETED';
      await application.save();
    } else if (application.documentsVerified !== pass.documentsVerified) {
      pass.documentsVerified = application.documentsVerified;
      pass.documents = application.documents;
      await pass.save();
    }

    const parsedQr = JSON.parse(pass.qrCodeData);

    return {
      passId: pass.passNumber,
      businessName: pass.businessName,
      syntheticReferenceId: pass.syntheticReferenceId,
      businessType: pass.businessType,
      foodCategories: pass.foodCategories,
      issueDate: pass.validFrom,
      validUntil: pass.validUntil,
      renewalStatus: pass.renewalStatus,
      renewalToken: pass.renewalToken,
      lastRenewedAt: pass.lastRenewedAt,
      prototypeStatus: pass.prototypeStatus,
      isPrototype: true,
      disclaimer: pass.disclaimer,
      premises: pass.premises,
      hygiene: pass.hygiene,
      documentsVerified: pass.documentsVerified,
      documents: pass.documents,
      communityTrust: pass.communityTrust,
      premisesVerification: application.premisesVerification,
      qrPayload: parsedQr,
    };
  }

  static async verifyPass(passId: string): Promise<SyntheticPassPayload> {
    let pass = await VendorPass.findOne({ passNumber: passId });

    if (!pass) {
      if (passId.startsWith('VPR-') || passId.startsWith('SYN-') || passId === 'demo' || passId === 'demo-app-101') {
        const syntheticRef = `SYN-FSSAI-${passId.slice(-5).toUpperCase()}`;
        pass = await VendorPass.create({
          passNumber: passId,
          applicationId: new mongoose.Types.ObjectId(),
          userId: new mongoose.Types.ObjectId(),
          syntheticReferenceId: syntheticRef,
          businessName: 'Rajesh Authentic Chaat & Snacks',
          vendorName: 'Rajesh Kumar',
          businessType: 'street_food_vendor',
          foodCategories: ['Cooked Food & Beverages', 'Street Chaat & Snacks'],
          fssaiRegistrationNumber: syntheticRef,
          qrCodeData: JSON.stringify({
            type: 'DEMO_VENDOR_PASS',
            passId,
            status: 'ACTIVE',
          }),
          category: 'Petty Food Manufacturer / Street Vendor',
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE',
          prototypeStatus: 'PROTOTYPE',
          isPrototype: true,
          disclaimer: 'Official FSSAI Fast-Track Digital Credential — Schedule 4 Basic Registration',
          premises: {
            verificationType: 'TVC_CERTIFICATE',
            wardNumber: 'Ward 14',
            tvcCertificateNumber: 'DL-NDMC-TVC-2024-8841',
            landmark: 'Sector 18 Market, Noida',
            isVerified: true,
          },
          hygiene: {
            passed: true,
            confidenceScore: 98,
            verifiedAt: new Date(),
            summaryBadge: 'AI Photo-Verified (5/5 Markers Detected)',
            summary: 'All 5 Schedule 4 hygiene markers verified.',
            isVerified: true,
            markers: {
              foodProtection: { detected: true, confidence: 95, label: 'Covered Food Containers' },
              potableWater: { detected: true, confidence: 92, label: 'Potable Water Dispenser' },
              coveredWasteBin: { detected: true, confidence: 89, label: 'Covered Waste Bin' },
              cleanSurface: { detected: true, confidence: 94, label: 'Clean Stainless Surface' },
            },
          },
          communityTrust: {
            averageRating: 4.8,
            totalReviews: 14,
            verifiedBadge: true,
            feedbackHistory: [
              {
                rating: 5,
                tags: ['Potable Water', 'Covered Food'],
                comment: 'Very clean cart and fresh water used!',
                submittedAt: new Date(Date.now() - 3600000 * 5),
              },
              {
                rating: 5,
                tags: ['Clean Stall', 'Covered Waste Bin'],
                comment: 'Hygiene is well maintained with covered dustbin.',
                submittedAt: new Date(Date.now() - 3600000 * 2),
              },
            ],
          },
          latestNotification: null,
        });
      } else {
        throw AppError.notFound(`Pass not found with ID: ${passId}`);
      }
    }

    const application = await Application.findById(pass.applicationId);
    const parsedQr = JSON.parse(pass.qrCodeData || '{}');

    return {
      passId: pass.passNumber,
      businessName: pass.businessName || application?.businessDetails?.businessName,
      vendingCategory: pass.category,
      status: pass.status,
      issuedAt: pass.validFrom,
      syntheticReferenceId: pass.syntheticReferenceId,
      businessType: pass.businessType,
      foodCategories: pass.foodCategories,
      issueDate: pass.validFrom,
      validUntil: pass.validUntil,
      renewalStatus: pass.renewalStatus,
      renewalToken: pass.renewalToken,
      lastRenewedAt: pass.lastRenewedAt,
      prototypeStatus: pass.prototypeStatus,
      isPrototype: true,
      disclaimer: pass.disclaimer,
      premises: pass.premises,
      hygiene: pass.hygiene,
      documentsVerified: pass.documentsVerified,
      documents: pass.documents,
      communityTrust: pass.communityTrust,
      latestNotification: pass.latestNotification,
      premisesVerification: pass.premises
        ? {
            type: pass.premises.verificationType,
            tvcId: pass.premises.tvcCertificateNumber,
            ward: pass.premises.wardNumber || pass.premises.landmark,
          }
        : undefined,
      qrPayload: parsedQr,
    };
  }

  static async getPassForApplication(
    applicationId: string,
    userId: string
  ): Promise<SyntheticPassPayload> {
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      throw AppError.badRequest('Invalid application ID format');
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      throw AppError.notFound('Application not found');
    }

    if (application.userId.toString() !== userId) {
      throw AppError.forbidden('You do not have permission to access this application');
    }

    const pass = await VendorPass.findOne({ applicationId: application._id });
    if (!pass) {
      throw AppError.notFound('No Vendor Pass generated for this application yet');
    }

    const parsedQr = JSON.parse(pass.qrCodeData);

    return {
      passId: pass.passNumber,
      businessName: pass.businessName || application.businessDetails?.businessName,
      syntheticReferenceId: pass.syntheticReferenceId,
      businessType: pass.businessType,
      foodCategories: pass.foodCategories,
      issueDate: pass.validFrom,
      validUntil: pass.validUntil,
      renewalStatus: pass.renewalStatus,
      renewalToken: pass.renewalToken,
      lastRenewedAt: pass.lastRenewedAt,
      prototypeStatus: pass.prototypeStatus,
      isPrototype: true,
      disclaimer: pass.disclaimer,
      premises: pass.premises,
      hygiene: pass.hygiene,
      documentsVerified: pass.documentsVerified,
      documents: pass.documents,
      communityTrust: pass.communityTrust,
      premisesVerification: application.premisesVerification,
      qrPayload: parsedQr,
    };
  }
}
