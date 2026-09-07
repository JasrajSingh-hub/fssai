import { z } from 'zod';
import { ALLOWED_BUSINESS_TYPES } from '../ai/schemas/business.schema';

export const confirmBusinessReviewSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Application ID is required'),
  }),
  body: z.object({
    kind_of_business: z.enum(ALLOWED_BUSINESS_TYPES, {
      required_error: 'kind_of_business is required',
    }),
    food_categories: z
      .array(z.string().trim().min(1, 'Food category cannot be empty'))
      .min(1, 'At least one food category is required'),
    business_description: z.string().trim().optional(),
    annual_turnover_estimated: z.number().optional(),
  }),
});

export const premisesVerificationSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Application ID is required'),
  }),
  body: z.object({
    verificationType: z
      .enum(['TVC_CERTIFICATE', 'PM_SVANIDHI', 'GEOTAG_FALLBACK'])
      .optional(),
    tvcCertificateNumber: z.string().trim().optional(),
    wardNumber: z.string().trim().optional(),
    issuingMunicipality: z.string().trim().optional(),
    loanApplicationNumber: z.string().trim().optional(),
    coordinates: z
      .union([
        z.object({
          latitude: z.number().optional(),
          longitude: z.number().optional(),
        }),
        z.tuple([z.number(), z.number()]),
      ])
      .optional(),
    landmark: z.string().trim().optional(),
    type: z.string().optional(),
    tvcId: z.string().optional(),
    ward: z.string().optional(),
  }),
});

export const applicationIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Application ID is required'),
  }),
});

export const deficiencyParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Application ID is required'),
  }),
  body: z.object({
    code: z.string().trim().min(1).optional(),
  }),
});

export const remedyTokenParamSchema = z.object({
  params: z.object({
    token: z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid remedy token'),
  }),
});

export const resolveRemedySchema = z.object({
  params: z.object({
    token: z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid remedy token'),
  }),
  body: z.object({
    proofUrl: z.string().trim().min(1).optional(),
  }),
});

export type ConfirmBusinessReviewInput = z.infer<typeof confirmBusinessReviewSchema>['body'];
export type PremisesVerificationInput = z.infer<typeof premisesVerificationSchema>['body'];
