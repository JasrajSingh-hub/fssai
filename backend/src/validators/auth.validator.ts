import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters'),
    phone: z
      .string({ required_error: 'Phone number is required' })
      .trim()
      .min(10, 'Phone must be at least 10 digits')
      .max(15, 'Phone cannot exceed 15 digits'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(6, 'Password must be at least 6 characters'),
    email: z
      .string()
      .email('Invalid email address')
      .optional()
      .or(z.literal('')),
    role: z
      .enum(['VENDOR', 'INSPECTOR', 'OFFICER'])
      .optional()
      .default('VENDOR'),
    businessName: z.string().trim().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    phone: z
      .string({ required_error: 'Phone number is required' })
      .trim()
      .min(10, 'Phone must be at least 10 digits'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password cannot be empty'),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];