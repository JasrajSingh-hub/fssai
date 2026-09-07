import mongoose, { Document, Schema, Model } from 'mongoose';

export type PassStatus = 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'PROTOTYPE';

export interface ICommunityFeedback {
  rating: number;
  tags?: string[];
  comment?: string;
  submittedAt: Date;
}

export interface IVendorNotification {
  title: string;
  message: string;
  rating?: number;
  tags?: string[];
  timestamp: Date;
  read: boolean;
}

export interface IVendorPass extends Document {
  _id: mongoose.Types.ObjectId;
  passNumber: string;
  passId?: string;
  applicationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  syntheticReferenceId: string;
  businessType: string;
  foodCategories: string[];
  qrCodeData: string;
  vendorName?: string;
  businessName?: string;
  fssaiRegistrationNumber: string;
  vendingZone?: string;
  category: string;
  validFrom: Date;
  validUntil: Date;
  renewalStatus: 'CURRENT' | 'DUE_SOON' | 'EXPIRED' | 'RENEWED';
  renewalToken?: string;
  lastRenewedAt?: Date;
  status: PassStatus;
  prototypeStatus: string;
  isPrototype: boolean;
  disclaimer: string;
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
    feedbackHistory: ICommunityFeedback[];
  };
  latestNotification?: IVendorNotification | null;
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new mongoose.Schema(
  {
    rating: { type: Number, min: 1, max: 5, required: true },
    tags: [{ type: String }],
    comment: { type: String, trim: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String },
    message: { type: String },
    rating: { type: Number },
    tags: [{ type: String }],
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
  },
  { _id: false }
);

const VendorPassSchema = new Schema<IVendorPass>(
  {
    passNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    passId: {
      type: String,
      index: true,
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    syntheticReferenceId: {
      type: String,
      required: true,
      index: true,
    },
    businessType: {
      type: String,
      required: true,
    },
    foodCategories: [{ type: String }],
    qrCodeData: {
      type: String,
      required: true,
    },
    vendorName: {
      type: String,
    },
    businessName: {
      type: String,
    },
    fssaiRegistrationNumber: {
      type: String,
      required: true,
      index: true,
    },
    vendingZone: {
      type: String,
      default: 'Designated Municipal Street Vending Zone A-1 (Demo)',
    },
    category: {
      type: String,
      default: 'Petty Food Manufacturer / Street Vendor',
    },
    validFrom: {
      type: Date,
      required: true,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    },
    renewalStatus: {
      type: String,
      enum: ['CURRENT', 'DUE_SOON', 'EXPIRED', 'RENEWED'],
      default: 'CURRENT',
      index: true,
    },
    renewalToken: {
      type: String,
      index: true,
    },
    lastRenewedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'EXPIRED', 'PROTOTYPE'],
      default: 'ACTIVE',
      index: true,
    },
    prototypeStatus: {
      type: String,
      default: 'PROTOTYPE',
    },
    isPrototype: {
      type: Boolean,
      default: true,
    },
    disclaimer: {
      type: String,
      default: 'Independent Civic UX Prototype — NOT AN OFFICIAL FSSAI REGISTRATION — NOT A GOVERNMENT-ISSUED DOCUMENT',
    },
    premises: {
      verificationType: { type: String },
      wardNumber: { type: String },
      tvcCertificateNumber: { type: String },
      landmark: { type: String },
      isVerified: { type: Boolean, default: true },
    },
    hygiene: {
      passed: { type: Boolean, default: false },
      confidenceScore: { type: Number, default: 0 },
      verifiedAt: { type: Date },
      summaryBadge: { type: String },
      summary: { type: String },
      isVerified: { type: Boolean, default: false },
      markers: {
        foodProtection: {
          detected: { type: Boolean, default: false },
          confidence: { type: Number, default: 0 },
          label: { type: String },
        },
        potableWater: {
          detected: { type: Boolean, default: false },
          confidence: { type: Number, default: 0 },
          label: { type: String },
        },
        coveredWasteBin: {
          detected: { type: Boolean, default: false },
          confidence: { type: Number, default: 0 },
          label: { type: String },
        },
        cleanSurface: {
          detected: { type: Boolean, default: false },
          confidence: { type: Number, default: 0 },
          label: { type: String },
        },
      },
    },
    documentsVerified: { type: Boolean, default: false },
    documents: [
      {
        _id: false,
        documentType: { type: String },
        fileName: { type: String },
        fileUrl: { type: String },
        status: { type: String },
        uploadedAt: { type: Date },
      },
    ],
    communityTrust: {
      averageRating: { type: Number, default: 4.8 },
      totalReviews: { type: Number, default: 14 },
      verifiedBadge: { type: Boolean, default: true },
      feedbackHistory: { type: [feedbackSchema], default: [] },
    },
    latestNotification: { type: notificationSchema, default: null },
  },
  {
    timestamps: true,
  }
);

VendorPassSchema.pre('save', function (next) {
  if (!this.passId && this.passNumber) {
    this.passId = this.passNumber;
  }
  next();
});

export const VendorPass: Model<IVendorPass> = mongoose.model<IVendorPass>(
  'VendorPass',
  VendorPassSchema
);
