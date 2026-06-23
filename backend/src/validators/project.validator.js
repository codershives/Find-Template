import { z } from 'zod';

const projectStatus = z.enum(['in_progress', 'completed', 'pending']);
const templateText = z.string().trim().max(3000).optional().nullable();

export const projectSchema = z.object({
  name: z.string().trim().min(2, 'Project name is required'),
  status: projectStatus,
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  clientName: z.string().trim().min(2, 'Client name is required'),
  budget: z.number().min(0, 'Budget must be a positive number'),
  templateKey: z.string().trim().optional().nullable(),
  templateName: z.string().trim().optional().nullable(),
  templateType: z.string().trim().optional().nullable(),
});

export const projectStatusSchema = z.object({
  status: projectStatus,
});

export const projectTemplateSchema = z.object({
  templateKey: z.string().trim().optional().nullable(),
  templateName: z.string().trim().optional().nullable(),
  templateType: z.string().trim().optional().nullable(),
  templateContent: z
    .object({
      brand: templateText,
      navHome: templateText,
      navAbout: templateText,
      navService: templateText,
      navContact: templateText,
      heroHeadline: templateText,
      heroSubtext: templateText,
      aboutTitle: templateText,
      aboutText: templateText,
      servicesTitle: templateText,
      serviceOneTitle: templateText,
      serviceOneText: templateText,
      serviceTwoTitle: templateText,
      serviceTwoText: templateText,
      serviceThreeTitle: templateText,
      serviceThreeText: templateText,
      premiumText: templateText,
      contactTitle: templateText,
      contactText: templateText,
    })
    .partial()
    .optional()
    .nullable(),
  heroImage: z.string().max(2_500_000, 'Image is too large').optional().nullable(),
});
