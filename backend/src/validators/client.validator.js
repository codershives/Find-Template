import { z } from 'zod';

const email = z.string().trim().email('Valid email is required').toLowerCase();
const paymentDate = z.string().min(1, 'Payment date is required');

export const createClientSchema = z.object({
  name: z.string().trim().min(2, 'Client name is required'),
  email,
  mobileNumber: z.string().trim().min(7, 'Mobile number is required'),
  projectName: z.string().trim().min(2, 'Project name is required'),
  websiteType: z.string().trim().min(2, 'Website type is required'),
  projectBudget: z.coerce.number().min(0, 'Project budget must be a positive number'),
  receivedAmount: z.coerce.number().min(0, 'Received amount must be a positive number'),
  pendingAmount: z.coerce.number().min(0, 'Pending amount must be a positive number').optional(),
  paymentDate,
});

export const updateClientSchema = z.object({
  name: z.string().trim().min(2, 'Client name is required').optional(),
  email: email.optional(),
  mobileNumber: z.string().trim().min(7, 'Mobile number is required').optional(),
  projectName: z.string().trim().min(2, 'Project name is required').optional(),
  websiteType: z.string().trim().min(2, 'Website type is required').optional(),
  projectBudget: z.coerce.number().min(0, 'Project budget must be a positive number').optional(),
  receivedAmount: z.coerce.number().min(0, 'Received amount must be a positive number').optional(),
  pendingAmount: z.coerce.number().min(0, 'Pending amount must be a positive number').optional(),
  paymentDate: paymentDate.optional(),
});
