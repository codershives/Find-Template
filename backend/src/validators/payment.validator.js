import { z } from 'zod';

const sourceId = z.string().trim().min(1, 'Square payment source is required');
const email = z.string().trim().email('Valid payment email is required').toLowerCase();
const idempotencyKey = z.string().trim().min(8, 'Invalid payment request').max(128, 'Invalid payment request').optional();

export const packagePaymentSchema = z.object({
  sourceId,
  plan: z.enum(['plus', 'pro', 'business']),
  billing: z.enum(['monthly', 'yearly']),
  email,
  idempotencyKey,
});

export const templatePaymentSchema = z.object({
  sourceId,
  templateKey: z.string().trim().min(1, 'Template key is required'),
  email,
  idempotencyKey,
});
