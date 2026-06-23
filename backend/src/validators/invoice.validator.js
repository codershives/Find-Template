import { z } from 'zod';

const status = z.enum(['paid', 'pending']);

export const createInvoiceSchema = z.object({
  clientId: z.string().optional().nullable(),
  clientName: z.string().trim().min(2, 'Client name is required'),
  clientEmail: z.string().trim().email('Valid email is required'),
  projectName: z.string().trim().min(2, 'Project name is required'),
  amount: z.coerce.number().min(0, 'Amount must be a positive number'),
  dueDate: z.string().min(1, 'Due date is required'),
  status,
});

export const updateInvoiceSchema = z.object({
  clientId: z.string().optional().nullable(),
  clientName: z.string().trim().min(2, 'Client name is required').optional(),
  clientEmail: z.string().trim().email('Valid email is required').optional(),
  projectName: z.string().trim().min(2, 'Project name is required').optional(),
  amount: z.coerce.number().min(0, 'Amount must be a positive number').optional(),
  dueDate: z.string().min(1, 'Due date is required').optional(),
  status: status.optional(),
});
