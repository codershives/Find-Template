import { Inquiry } from '../models/Inquiry.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendInquiryEmail } from '../utils/mailer.js';

const INQUIRY_RECEIVER_EMAIL = 'admin@findtempletes.com';

export const createInquiry = asyncHandler(async (req, res) => {
  const inquiry = await Inquiry.create({
    ...req.body,
    receiverEmail: INQUIRY_RECEIVER_EMAIL,
  });

  try {
    await sendInquiryEmail({
      to: INQUIRY_RECEIVER_EMAIL,
      name: req.body.name,
      email: req.body.email,
      message: req.body.message,
    });
  } catch (error) {
    console.error('Inquiry email failed:', error.message);
  }

  return res.status(201).json({
    success: true,
    message: 'Inquiry submitted successfully',
    data: inquiry,
  });
});
