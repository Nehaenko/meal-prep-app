import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

const COOKIE = 'token';
const isProd = process.env.NODE_ENV === 'production';
const jwtIssuer = process.env.JWT_ISSUER || 'meal-prep-api';
const jwtAudience = process.env.JWT_AUDIENCE || 'meal-prep-web';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  (req as any).setAuthCookie = (user: { id: string; email: string }) => {
    const token = jwt.sign(user, process.env.JWT_SECRET as string, {
      expiresIn: '7d',
      issuer: jwtIssuer,
      audience: jwtAudience,
    });
    res.cookie(COOKIE, token, {
      httpOnly: true,
      // Cross-site auth (Netlify -> Render) requires SameSite=None + Secure.
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
  };
  (req as any).clearAuthCookie = () =>
    res.clearCookie(COOKIE, {
      path: '/',
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd,
    });
  (req as any).user = null;

  const token = (req as any).cookies?.[COOKIE];
  if (token) {
    try {
      (req as any).user = jwt.verify(token, process.env.JWT_SECRET as string, {
        issuer: jwtIssuer,
        audience: jwtAudience,
      });
    } catch {}
  }
  next();
}

export function getUserFromReq(req: Request) {
  return (req as any).user;
}
