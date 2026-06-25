import { Router } from 'express';
import { deleteAccount, getProfile, updatePassword, updateProfile } from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { deleteAccountSchema, updatePasswordSchema, updateProfileSchema } from '../validators/user.validator.js';

const router = Router();

router.use(requireAuth);
router.get('/profile', requireRole('admin', 'developer', 'designer', 'manager'), getProfile);
router.patch('/profile', requireRole('admin', 'developer', 'designer', 'manager'), validate(updateProfileSchema), updateProfile);
router.patch('/password', requireRole('admin', 'developer', 'designer', 'manager'), validate(updatePasswordSchema), updatePassword);
router.delete('/account', requireRole('admin', 'developer', 'designer', 'manager'), validate(deleteAccountSchema), deleteAccount);

export default router;
