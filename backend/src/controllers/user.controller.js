import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authCookieOptions } from '../utils/cookieOptions.js';
import { comparePassword, hashPassword } from '../utils/password.js';

const serializeProfile = async (user) => {
  const profile = user.toSafeProfile();

  if (user.role === 'admin' || user.isOwner) {
    return {
      ...profile,
      loginEmail: user.email,
      ownerEmail: user.email,
    };
  }

  const owner = await User.findById(user.ownerId);
  if (!owner) return profile;

  const ownerProfile = owner.toSafeProfile();
  return {
    ...profile,
    companyName: owner.companyName,
    companyEmail: owner.accountType === 'company_business' ? owner.companyEmail : null,
    selectedPackage: ownerProfile.selectedPackage,
    selectedPackageBilling: ownerProfile.selectedPackageBilling,
    selectedPackagePrice: ownerProfile.selectedPackagePrice,
    selectedPackageActivatedAt: ownerProfile.selectedPackageActivatedAt,
    selectedPackageExpiresAt: ownerProfile.selectedPackageExpiresAt,
    paymentEmail: ownerProfile.paymentEmail,
    paymentMethod: ownerProfile.paymentMethod,
    purchasedTemplates: ownerProfile.purchasedTemplates,
    loginEmail: user.email,
    ownerEmail: owner.email,
  };
};

export const getProfile = asyncHandler(async (req, res) => {
  return res.json({ success: true, message: 'Profile fetched successfully', data: await serializeProfile(req.user) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  if (req.body.name !== undefined) req.user.name = req.body.name;
  if (req.body.themeMode !== undefined) req.user.themeMode = req.body.themeMode;
  await req.user.save();

  return res.json({ success: true, message: 'Profile updated successfully', data: await serializeProfile(req.user) });
});

export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await req.user.constructor.findById(req.user._id).select('+passwordHash');

  const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  }

  user.plainPass = newPassword;
  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  return res.json({ success: true, message: 'Password updated successfully', data: null });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const { currentPassword } = req.body;
  const user = await req.user.constructor.findById(req.user._id).select('+passwordHash');

  if (!user) {
    return res.status(404).json({ success: false, message: 'Account not found' });
  }

  const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  }

  await user.deleteOne();
  res.clearCookie('nexlance_token', authCookieOptions);

  return res.json({ success: true, message: 'Account deleted successfully', data: null });
});
