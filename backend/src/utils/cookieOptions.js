import { env } from '../config/env.js';

const isSecureCookie = env.nodeEnv === 'production' || process.env.RENDER === 'true';

export const authCookieOptions = {
  httpOnly: true,
  sameSite: isSecureCookie ? 'none' : 'lax',
  secure: isSecureCookie,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
