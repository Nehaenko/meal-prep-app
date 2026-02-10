import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

const COOKIE = 'token';
const isProd = process.env.NODE_ENV === 'production';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  (req as any).setAuthCookie = (user: { id: string; email: string }) => {
    const token = jwt.sign(user, process.env.JWT_SECRET as string, { expiresIn: '7d' });
    res.cookie(COOKIE, token, {
      httpOnly: true,
      // Cross-site auth (Netlify -> Render) requires SameSite=None + Secure.
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd,
      path: '/'
    });
  };
  (req as any).clearAuthCookie = () =>
    res.clearCookie(COOKIE, { path: '/', sameSite: isProd ? 'none' : 'lax', secure: isProd });
  (req as any).user = null;

  const token = (req as any).cookies?.[COOKIE];
  if (token) {
    try { (req as any).user = jwt.verify(token, process.env.JWT_SECRET as string); } catch {}
  }
  next();
}

export function getUserFromReq(req: Request) {
  return (req as any).user;
}
