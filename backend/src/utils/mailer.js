import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const getTransporter = () => {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass || !env.smtpFrom) {
    const error = new Error('SMTP email settings are not configured');
    error.statusCode = 500;
    throw error;
  }

  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass.replace(/\s/g, ''),
    },
  });
};

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

export const sendPasswordResetOtpEmail = async ({ to, name, otp }) => {
  const transporter = getTransporter();
  const safeName = name || 'User';

  await transporter.sendMail({
    from: env.smtpFrom,
    to,
    subject: 'Your Find Template password reset OTP',
    text: `Hi ${safeName},\n\nYour password reset OTP is ${otp}. It will expire in ${env.passwordResetOtpExpiresMinutes} minutes.\n\nIf you did not request this, you can ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
        <h2 style="margin: 0 0 12px;">Password reset OTP</h2>
        <p>Hi ${safeName},</p>
        <p>Your Find Template password reset OTP is:</p>
        <p style="font-size: 28px; font-weight: 800; letter-spacing: 6px; margin: 18px 0;">${otp}</p>
        <p>This OTP will expire in ${env.passwordResetOtpExpiresMinutes} minutes.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  });
};

export const sendInquiryEmail = async ({ to, name, email, message }) => {
  const transporter = getTransporter();
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message);

  await transporter.sendMail({
    from: env.smtpFrom,
    to,
    replyTo: email,
    subject: `New FindTemplates inquiry from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
        <h2 style="margin: 0 0 12px;">New FindTemplates inquiry</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-line; background: #f8fafc; padding: 14px; border-radius: 10px;">${safeMessage}</p>
      </div>
    `,
  });
};
