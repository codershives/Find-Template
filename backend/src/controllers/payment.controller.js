import { PACKAGE_PRICE_CENTS, getPackageExpiry, getPackagePrice, getPackageTemplateLimit, getPurchasedTemplateCount, getTemplateLimitMessage, isPackageActive } from '../utils/packageRules.js';
import { getTemplateByKey } from '../utils/templateRules.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createSquarePayment } from '../services/square.service.js';

const squarePaymentMethod = 'square_card';
const compactUserId = (userId) => String(userId).slice(-12);

export const createPackagePayment = asyncHandler(async (req, res) => {
  const { sourceId, plan, billing, email, idempotencyKey } = req.body;
  const amountCents = PACKAGE_PRICE_CENTS[billing]?.[plan];

  if (!amountCents) {
    return res.status(400).json({ success: false, message: 'Invalid package selected' });
  }

  const payment = await createSquarePayment({
    sourceId,
    amountCents,
    idempotencyKey,
    note: `${plan} ${billing} package purchase`,
    referenceId: `pkg:${compactUserId(req.user._id)}:${plan}:${billing}`,
  });

  const activatedAt = new Date();
  req.user.selectedPackage = plan;
  req.user.selectedPackageBilling = billing;
  req.user.selectedPackagePrice = getPackagePrice(billing, plan);
  req.user.selectedPackageActivatedAt = activatedAt;
  req.user.selectedPackageExpiresAt = getPackageExpiry(billing, activatedAt);
  req.user.paymentEmail = email;
  req.user.paymentMethod = squarePaymentMethod;

  await req.user.save();

  return res.json({
    success: true,
    message: 'Square payment confirmed successfully',
    data: {
      profile: req.user.toSafeProfile(),
      payment,
    },
  });
});

export const createTemplatePayment = asyncHandler(async (req, res) => {
  const { sourceId, templateKey, email, idempotencyKey } = req.body;
  const alreadyPurchased = req.user.purchasedTemplates?.some((template) => template.templateKey === templateKey);

  if (alreadyPurchased) {
    return res.json({
      success: true,
      message: 'Template already available in your package.',
      data: {
        profile: req.user.toSafeProfile(),
        payment: null,
      },
    });
  }

  if (!isPackageActive(req.user)) {
    return res.status(403).json({ success: false, message: getTemplateLimitMessage(req.user) });
  }

  const templateLimit = getPackageTemplateLimit(req.user.selectedPackage);
  const purchasedCount = getPurchasedTemplateCount(req.user);

  if (purchasedCount >= templateLimit) {
    return res.status(403).json({ success: false, message: getTemplateLimitMessage(req.user) });
  }

  const template = getTemplateByKey(templateKey);
  if (!template) {
    return res.status(404).json({ success: false, message: 'Template not found' });
  }

  const payment = await createSquarePayment({
    sourceId,
    amountCents: template.priceCents,
    idempotencyKey,
    note: `${template.name} template purchase`,
    referenceId: `tpl:${compactUserId(req.user._id)}:${templateKey}`,
  });

  req.user.purchasedTemplates.push({
    templateKey,
    name: template.name,
    type: template.type,
    paymentEmail: email,
    paymentMethod: squarePaymentMethod,
    purchasedAt: new Date(),
  });

  await req.user.save();

  return res.json({
    success: true,
    message: 'Template payment confirmed successfully',
    data: {
      profile: req.user.toSafeProfile(),
      payment,
    },
  });
});
