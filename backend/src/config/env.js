import dotenv from 'dotenv';

dotenv.config({ override: true });

export const env = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nexlance',
  jwtSecret: process.env.JWT_SECRET || 'replace_with_secure_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || process.env.SMTP_USER || '',
  passwordResetOtpExpiresMinutes: Number(process.env.PASSWORD_RESET_OTP_EXPIRES_MINUTES || 10),
  squareEnvironment: process.env.SQUARE_ENVIRONMENT || 'sandbox',
  squareAccessToken: process.env.SQUARE_ACCESS_TOKEN || '',
  squareLocationId: process.env.SQUARE_LOCATION_ID || '',
  squareCurrency: process.env.SQUARE_CURRENCY || 'USD',
};
