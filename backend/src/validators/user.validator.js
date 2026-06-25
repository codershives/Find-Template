import { z } from 'zod';

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2, 'Name is required').optional(),
    themeMode: z.enum(['light', 'dark']).optional(),
  })
  .refine((data) => data.name !== undefined || data.themeMode !== undefined, {
    message: 'Nothing to update',
  });

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export const deleteAccountSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
});
