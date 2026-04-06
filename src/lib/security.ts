import { NextResponse } from 'next/server';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(identifier: string, maxRequests: number = 10, windowMs: number = 60000) {
  const now = Date.now();
  const windowKey = Math.floor(now / windowMs);
  const key = `${identifier}:${windowKey}`;

  const current = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };

  if (current.count >= maxRequests) {
    return { limited: true, resetTime: current.resetTime };
  }

  current.count++;
  rateLimitStore.set(key, current);

  // Clean up old entries
  for (const [k, v] of rateLimitStore.entries()) {
    if (now > v.resetTime) {
      rateLimitStore.delete(k);
    }
  }

  return { limited: false };
}

export function validateCertificateData(data: any) {
  const errors = [];

  if (!data.hash || typeof data.hash !== 'string' || data.hash.length !== 64) {
    errors.push('Invalid hash format');
  }

  if (!data.studentName || typeof data.studentName !== 'string' || data.studentName.length > 100) {
    errors.push('Invalid student name');
  }

  if (!data.universityName || typeof data.universityName !== 'string' || data.universityName.length > 200) {
    errors.push('Invalid university name');
  }

  if (!data.degreeName || typeof data.degreeName !== 'string' || data.degreeName.length > 100) {
    errors.push('Invalid degree name');
  }

  if (!data.recordUrl || typeof data.recordUrl !== 'string' || !data.recordUrl.startsWith('http')) {
    errors.push('Invalid record URL');
  }

  return errors;
}

export function sanitizeInput(input: string): string {
  // Basic XSS prevention
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function validateLinkedInToken(token: string): boolean {
  // Basic token format validation
  return typeof token === 'string' && token.length > 50 && /^[A-Za-z0-9_-]+$/.test(token);
}

export function createSecureResponse(data: any, status: number = 200) {
  const response = NextResponse.json(data, { status });

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}