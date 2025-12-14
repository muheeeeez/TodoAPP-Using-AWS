import { createHash, randomBytes, pbkdf2Sync } from 'crypto';

/**
 * Hash password using PBKDF2
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

/**
 * Verify password against hash
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const verifyHash = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

/**
 * Generate JWT token (simplified version using HMAC)
 * Note: In production, consider using a proper JWT library like 'jsonwebtoken'
 */
export function generateToken(payload: { userId: string; email: string }): string {
  // Use environment JWT_SECRET or fall back to a default for development
  const secret = process.env.JWT_SECRET || 'default-jwt-secret-for-development-only-not-for-production';
  
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + (24 * 60 * 60), // 24 hours
  };
  
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(tokenPayload));
  
  const signature = createHash('sha256')
    .update(`${encodedHeader}.${encodedPayload}.${secret}`)
    .digest('base64url');
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    // Use environment JWT_SECRET or fall back to a default for development
    const secret = process.env.JWT_SECRET || 'default-jwt-secret-for-development-only-not-for-production';
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    
    if (!encodedHeader || !encodedPayload || !signature) {
      return null;
    }
    
    // Verify signature
    const expectedSignature = createHash('sha256')
      .update(`${encodedHeader}.${encodedPayload}.${secret}`)
      .digest('base64url');
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    // Decode payload
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Token expired
    }
    
    return {
      userId: payload.userId,
      email: payload.email,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Base64 URL encode
 */
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Base64 URL decode
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Requirements: At least 8 characters, 1 uppercase, 1 lowercase, 1 number
 */
export function isValidPassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  return { valid: true };
}

