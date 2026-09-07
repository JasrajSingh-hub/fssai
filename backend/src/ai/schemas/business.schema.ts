import { z } from 'zod';

export const ALLOWED_BUSINESS_TYPES = [
  'hawker',
  'street_food_vendor',
  'home_kitchen',
  'tea_stall',
  'petty_food_retailer',
  'unknown',
] as const;

export type BusinessType = (typeof ALLOWED_BUSINESS_TYPES)[number];

export const businessExtractionSchema = z.object({
  kind_of_business: z.enum(ALLOWED_BUSINESS_TYPES),
  food_categories: z.array(z.string().trim().min(1)),
  business_description: z.string().trim().min(1),
  language: z.string().trim().min(1),
  missing_information: z.array(z.string().trim().min(1)),
});

export type BusinessExtractionResult = z.infer<typeof businessExtractionSchema>;

export const intakeAnalyzeRequestSchema = z.object({
  body: z
    .object({
      transcript: z
        .string()
        .trim()
        .min(3, 'Transcript must be at least 3 characters long')
        .max(4000, 'Transcript is too long')
        .optional(),
      rawTranscript: z
        .string()
        .trim()
        .min(3, 'Transcript must be at least 3 characters long')
        .max(4000, 'Transcript is too long')
        .optional(),
      language: z.string().optional(),
      applicationId: z.string().optional(),
    })
    .refine((data) => !!(data.transcript || data.rawTranscript), {
      message: 'Transcript is required',
    }),
});

export type IntakeAnalyzeInput = z.infer<typeof intakeAnalyzeRequestSchema>['body'];