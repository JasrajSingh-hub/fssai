import { z } from 'zod';

export const completeHygieneSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Application ID is required'),
  }),
  body: z
    .object({
      completedItemIds: z.array(z.string().trim().min(1, 'Item ID cannot be empty')).optional(),
      passed: z.boolean().optional(),
      confidenceScore: z.number().min(0).max(100).optional(),
      markers: z
        .object({
          foodProtection: z.object({
            detected: z.boolean(),
            confidence: z.number().min(0).max(100).default(0),
            label: z.string().optional(),
          }),
          potableWater: z.object({
            detected: z.boolean(),
            confidence: z.number().min(0).max(100).default(0),
            label: z.string().optional(),
          }),
          coveredWasteBin: z.object({
            detected: z.boolean(),
            confidence: z.number().min(0).max(100).default(0),
            label: z.string().optional(),
          }),
          cleanSurface: z.object({
            detected: z.boolean(),
            confidence: z.number().min(0).max(100).default(0),
            label: z.string().optional(),
          }),
        })
        .optional(),
      summary: z.string().trim().optional(),
    })
    .refine((body) => body.completedItemIds?.length || body.markers || body.passed !== undefined, {
      message: 'Provide completedItemIds or AI hygiene audit markers',
    }),
});

export const uploadDocumentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Application ID is required'),
  }),
  body: z.object({
    documentType: z
      .enum(['STALL_PHOTO', 'OPERATOR_PHOTO', 'TVC_PROOF', 'NOC_CERTIFICATE'])
      .default('STALL_PHOTO'),
    fileName: z.string().trim().min(1).optional(),
    fileUrl: z.string().trim().min(1).optional(),
    documentTitle: z.string().trim().min(1).default('Synthetic Stall Photo / Premise Mock'),
    fileData: z.string().min(10, 'File data cannot be empty').optional(),
    mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], {
      errorMap: () => ({
        message: 'Invalid file type. Supported formats: image/jpeg, image/png, image/webp, application/pdf',
      }),
    }),
    fileSizeBytes: z
      .number()
      .max(5 * 1024 * 1024, 'File size exceeds maximum allowed limit of 5MB')
      .optional(),
    isSynthetic: z.boolean().default(true),
  }).refine((body) => body.fileData || body.fileUrl, {
    message: 'Provide file data or a file URL',
  }),
});

export const scanStallSchema = z.object({
  body: z.object({
    imageBase64: z.string().min(50, 'Image data cannot be empty'),
  }),
});

export type CompleteHygieneInput = z.infer<typeof completeHygieneSchema>['body'];
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>['body'];
export type ScanStallInput = z.infer<typeof scanStallSchema>['body'];
