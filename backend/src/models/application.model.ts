import mongoose, { Document, Schema, Model } from 'mongoose';

export const APPLICATION_STATUSES = [
  'DRAFT',
  'VOICE_CAPTURED',
  'AI_PROCESSED',
  'REVIEW_PENDING',
  'USER_CONFIRMED',
  'ELIGIBILITY_CHECKED',
  'HYGIENE_GENERATED',
  'PAYMENT_PENDING',
  'PAYMENT_SIMULATED',
  'PASS_GENERATED',
  'DEFICIENCY_RAISED',
  'UNDER_REVIEW',
  'COMPLETED',
] as const;

export type ApplicationStatus = typeof APPLICATION_STATUSES[number];

export interface IApplication extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: ApplicationStatus;
  voiceIntake?: {
    rawTranscript?: string;
    audioUrl?: string;
    detectedLanguage?: string;
    confidence?: number;
  };
  businessDetails?: {
    businessName?: string;
    ownerName?: string;
    phone?: string;
    stallType?: string; // e.g. tea_stall, street_food_vendor, hawker
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    monthlyTurnover?: number;
    annualTurnoverEstimated?: number;
    foodCategory?: string[]; // e.g. Snacks, Beverages, Meals
    waterSource?: string;
    wasteDisposalMethod?: string;
  };
  eligibility?: {
    path?: string;
    fee?: number;
    currency?: string;
    isPrototype?: boolean;
    message?: string;
    disclaimer?: string;
    criteriaNotes?: string[];
    fssaiTier?: 'BASIC_REGISTRATION' | 'STATE_LICENSE' | 'CENTRAL_LICENSE';
    isEligibleForBasic?: boolean;
    statutoryFee?: number;
    schemeName?: string;
    checkedAt?: Date;
  };
  premises?: {
    verificationType: 'TVC_CERTIFICATE' | 'PM_SVANIDHI' | 'GEOTAG_FALLBACK';
    tvcCertificateNumber?: string;
    wardNumber?: string;
    issuingMunicipality?: string;
    loanApplicationNumber?: string;
    coordinates?: {
      latitude?: number;
      longitude?: number;
    };
    landmark?: string;
    verifiedAt?: Date;
    isVerified?: boolean;
  };
  premisesVerification?: {
    type?: string;
    tvcId?: string;
    ward?: string;
    coordinates?: [number, number];
  };
  hygieneChecklist?: {
    overallScore?: number;
    isPrototype?: boolean;
    completedItems?: string[];
    items?: Array<{
      id: string;
      title: string;
      description?: string;
      compliant: boolean;
      mandatory: boolean;
      guidance?: string;
    }>;
    generatedAt?: Date;
  };
  hygieneAudit?: {
    passed?: boolean;
    confidenceScore?: number;
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
    summary?: string;
    verifiedAt?: Date;
    isVerified?: boolean;
  };
  syntheticDocument?: {
    applicationRefNumber?: string;
    formType?: string; // Form A (FSSAI)
    documentTitle?: string;
    documentData?: string;
    mimeType?: string;
    fileSize?: number;
    isSynthetic?: boolean;
    generatedAt?: Date;
    downloadUrl?: string;
  };
  documents: Array<{
    documentType: 'STALL_PHOTO' | 'OPERATOR_PHOTO' | 'TVC_PROOF' | 'NOC_CERTIFICATE';
    fileName: string;
    fileUrl?: string;
    status: 'PENDING' | 'VERIFIED' | 'REJECTED';
    uploadedAt: Date;
  }>;
  documentsVerified: boolean;
  deficiency?: {
    code: string;
    officerNotes: string;
    plainGuidanceHindi: string;
    plainGuidanceEnglish: string;
    remedyToken: string;
    status: 'OPEN' | 'RESOLVED';
    resolvedAt?: Date;
    remedyProofUrl?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PremisesSchema = new mongoose.Schema(
  {
    verificationType: {
      type: String,
      enum: ['TVC_CERTIFICATE', 'PM_SVANIDHI', 'GEOTAG_FALLBACK'],
      required: true,
    },
    tvcCertificateNumber: { type: String, trim: true },
    wardNumber: { type: String, trim: true },
    issuingMunicipality: { type: String, trim: true },
    loanApplicationNumber: { type: String, trim: true },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    landmark: { type: String, trim: true },
    verifiedAt: { type: Date, default: Date.now },
    isVerified: { type: Boolean, default: true },
  },
  { _id: false }
);

const HygieneMarkerSchema = new mongoose.Schema(
  {
    detected: { type: Boolean, required: true },
    confidence: { type: Number, default: 0 },
    label: { type: String },
  },
  { _id: false }
);

const HygieneAuditSchema = new mongoose.Schema(
  {
    passed: { type: Boolean, default: false },
    confidenceScore: { type: Number, default: 0 },
    markers: {
      foodProtection: HygieneMarkerSchema,
      potableWater: HygieneMarkerSchema,
      coveredWasteBin: HygieneMarkerSchema,
      cleanSurface: HygieneMarkerSchema,
    },
    summary: { type: String },
    verifiedAt: { type: Date, default: Date.now },
    isVerified: { type: Boolean, default: false },
  },
  { _id: false }
);

const DocumentSchema = new mongoose.Schema(
  {
    documentType: {
      type: String,
      enum: ['STALL_PHOTO', 'OPERATOR_PHOTO', 'TVC_PROOF', 'NOC_CERTIFICATE'],
      required: true,
    },
    fileName: { type: String, required: true },
    fileUrl: { type: String, default: 'mock_storage_url' },
    status: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'VERIFIED',
    },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ApplicationSchema = new Schema<IApplication>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: 'DRAFT',
      index: true,
    },
    voiceIntake: {
      rawTranscript: { type: String },
      audioUrl: { type: String },
      detectedLanguage: { type: String, default: 'en' },
      confidence: { type: Number },
    },
    businessDetails: {
      businessName: { type: String },
      ownerName: { type: String },
      phone: { type: String },
      stallType: { type: String },
      address: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
      monthlyTurnover: { type: Number },
      annualTurnoverEstimated: { type: Number },
      foodCategory: [{ type: String }],
      waterSource: { type: String },
      wasteDisposalMethod: { type: String },
    },
    eligibility: {
      path: { type: String, default: 'basic_registration' },
      fee: { type: Number, default: 100 },
      currency: { type: String, default: 'INR' },
      isPrototype: { type: Boolean, default: true },
      message: { type: String },
      disclaimer: { type: String },
      criteriaNotes: [{ type: String }],
      fssaiTier: {
        type: String,
        enum: ['BASIC_REGISTRATION', 'STATE_LICENSE', 'CENTRAL_LICENSE'],
        default: 'BASIC_REGISTRATION',
      },
      isEligibleForBasic: { type: Boolean, default: true },
      statutoryFee: { type: Number, default: 100 },
      schemeName: { type: String, default: 'FSSAI Basic Registration Prototype' },
      checkedAt: { type: Date },
    },
    premises: PremisesSchema,
    premisesVerification: {
      type: {
        type: String,
      },
      tvcId: {
        type: String,
      },
      ward: {
        type: String,
      },
      coordinates: {
        type: [Number],
      },
    },
    hygieneChecklist: {
      overallScore: { type: Number },
      isPrototype: { type: Boolean, default: true },
      completedItems: [{ type: String }],
      items: [
        {
          id: { type: String },
          title: { type: String },
          description: { type: String },
          compliant: { type: Boolean, default: false },
          mandatory: { type: Boolean, default: true },
          guidance: { type: String },
        },
      ],
      generatedAt: { type: Date },
    },
    hygieneAudit: HygieneAuditSchema,
    documents: [DocumentSchema],
    documentsVerified: { type: Boolean, default: false },
    deficiency: {
      code: { type: String },
      officerNotes: { type: String },
      plainGuidanceHindi: { type: String },
      plainGuidanceEnglish: { type: String },
      remedyToken: { type: String, index: true },
      status: { type: String, enum: ['OPEN', 'RESOLVED'] },
      resolvedAt: { type: Date },
      remedyProofUrl: { type: String },
    },
    syntheticDocument: {
      applicationRefNumber: { type: String },
      formType: { type: String, default: 'FORM_A_BASIC_REGISTRATION' },
      documentTitle: { type: String },
      documentData: { type: String },
      mimeType: { type: String },
      fileSize: { type: Number },
      isSynthetic: { type: Boolean, default: true },
      generatedAt: { type: Date },
      downloadUrl: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

export const Application: Model<IApplication> = mongoose.model<IApplication>(
  'Application',
  ApplicationSchema
);
