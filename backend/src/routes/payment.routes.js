import { Router } from 'express';
import { createPackagePayment, createTemplatePayment } from '../controllers/payment.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { packagePaymentSchema, templatePaymentSchema } from '../validators/payment.validator.js';

const router = Router();

router.use(requireAuth);
router.post('/package', requireRole('admin'), validate(packagePaymentSchema), createPackagePayment);
router.post('/template', requireRole('admin'), validate(templatePaymentSchema), createTemplatePayment);

export default router;
