/**
 * Authentication Routes — Prisma-backed (persistent)
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, HttpErrors } from '../middleware/errorHandler.js';
import { authenticate, generateTokens } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Email verification is opt-in via env var
const isVerificationRequired = () => process.env.EMAIL_VERIFICATION_REQUIRED === 'true';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

// Short-lived token stores (in-memory is fine for these transient tokens)
const verificationTokens = new Map();
const resetTokens = new Map();

const generateToken = () => crypto.randomBytes(32).toString('hex');

// ── POST /auth/register ───────────────────────────────────────────────────────
router.post('/register', asyncHandler(async (req, res) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    throw HttpErrors.badRequest('Validation failed', result.error.errors);
  }

  const { email, password, name } = result.data;

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw HttpErrors.conflict('User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const requiresVerification = isVerificationRequired();

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: 'user',
      emailVerified: requiresVerification ? null : new Date(),
    },
  });

  if (requiresVerification) {
    const verificationToken = generateToken();
    verificationTokens.set(verificationToken, {
      userId: user.id,
      email: user.email,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    console.log(`📧 Verification token for ${email}: ${verificationToken}`);

    const { password: _, ...userWithoutPassword } = user;
    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: { user: userWithoutPassword, requiresVerification: true },
    });
  }

  const tokens = generateTokens(user);
  const { password: _, ...userWithoutPassword } = user;

  res.status(201).json({
    success: true,
    data: { user: userWithoutPassword, ...tokens },
  });
}));

// ── POST /auth/verify-email ───────────────────────────────────────────────────
router.post('/verify-email', asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) throw HttpErrors.badRequest('Verification token required');

  const tokenData = verificationTokens.get(token);
  if (!tokenData) throw HttpErrors.badRequest('Invalid or expired verification token');
  if (new Date() > tokenData.expiresAt) {
    verificationTokens.delete(token);
    throw HttpErrors.badRequest('Verification token has expired');
  }

  const user = await prisma.user.update({
    where: { id: tokenData.userId },
    data: { emailVerified: new Date() },
  });

  verificationTokens.delete(token);

  const tokens = generateTokens(user);
  const { password: _, ...userWithoutPassword } = user;

  res.json({
    success: true,
    message: 'Email verified successfully',
    data: { user: userWithoutPassword, ...tokens },
  });
}));

// ── POST /auth/resend-verification ───────────────────────────────────────────
router.post('/resend-verification', asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw HttpErrors.badRequest('Email required');

  const user = await prisma.user.findUnique({ where: { email } });

  if (user && !user.emailVerified) {
    // Remove existing tokens for this user
    for (const [token, data] of verificationTokens) {
      if (data.userId === user.id) verificationTokens.delete(token);
    }

    const verificationToken = generateToken();
    verificationTokens.set(verificationToken, {
      userId: user.id,
      email: user.email,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    console.log(`📧 New verification token for ${email}: ${verificationToken}`);
  }

  res.json({
    success: true,
    message: 'If an unverified account exists with this email, a new verification link will be sent.',
  });
}));

// ── POST /auth/login ──────────────────────────────────────────────────────────
router.post('/login', asyncHandler(async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    throw HttpErrors.badRequest('Validation failed', result.error.errors);
  }

  const { email, password } = result.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) {
    throw HttpErrors.unauthorized('Invalid credentials');
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw HttpErrors.unauthorized('Invalid credentials');
  }

  if (isVerificationRequired() && !user.emailVerified) {
    throw HttpErrors.forbidden('Please verify your email before logging in');
  }

  const tokens = generateTokens(user);
  const { password: _, ...userWithoutPassword } = user;

  res.json({
    success: true,
    data: { user: userWithoutPassword, ...tokens },
  });
}));

// ── POST /auth/logout ─────────────────────────────────────────────────────────
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
}));

// ── GET /auth/me ──────────────────────────────────────────────────────────────
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });

  if (!user) throw HttpErrors.notFound('User not found');

  const { password: _, ...userWithoutPassword } = user;
  res.json({ success: true, data: userWithoutPassword });
}));

// ── PATCH /auth/me ────────────────────────────────────────────────────────────
// Actualiza campos de perfil: name, empresa, cargo, whatsapp
router.patch('/me', authenticate, asyncHandler(async (req, res) => {
  const allowed = [
    'name', 'empresa', 'cargo', 'whatsapp',
    'shippingStreet', 'shippingColonia', 'shippingCity', 'shippingState', 'shippingZip',
    'requiresInvoice', 'rfc', 'razonSocial', 'regimenFiscal', 'usoCFDI',
  ];
  const data = {};
  for (const field of allowed) {
    if (req.body[field] !== undefined) {
      data[field] = req.body[field]?.trim() || null;
    }
  }

  if (Object.keys(data).length === 0) {
    throw HttpErrors.badRequest('No hay campos válidos para actualizar');
  }

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data,
  });

  const { password: _, ...userWithoutPassword } = updated;
  res.json({ success: true, data: userWithoutPassword });
}));

// ── POST /auth/refresh ────────────────────────────────────────────────────────
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw HttpErrors.badRequest('Refresh token required');

  res.json({ success: true, data: { message: 'Token refresh placeholder' } });
}));

// ── POST /auth/forgot-password ────────────────────────────────────────────────
router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw HttpErrors.badRequest('Email required');

  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    // Remove existing reset tokens for this user
    for (const [token, data] of resetTokens) {
      if (data.userId === user.id) resetTokens.delete(token);
    }

    const resetToken = generateToken();
    resetTokens.set(resetToken, {
      userId: user.id,
      email: user.email,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    console.log(`📧 Reset token for ${email}: ${resetToken}`);
    console.log(`   Link: ${process.env.APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`);
  }

  res.json({
    success: true,
    message: 'If an account exists with this email, you will receive a password reset link',
  });
}));

// ── POST /auth/reset-password ─────────────────────────────────────────────────
router.post('/reset-password', asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) throw HttpErrors.badRequest('Token and password required');
  if (password.length < 8) throw HttpErrors.badRequest('Password must be at least 8 characters');

  const tokenData = resetTokens.get(token);
  if (!tokenData) throw HttpErrors.badRequest('Invalid or expired reset token');
  if (new Date() > tokenData.expiresAt) {
    resetTokens.delete(token);
    throw HttpErrors.badRequest('Reset token has expired');
  }

  await prisma.user.update({
    where: { id: tokenData.userId },
    data: { password: await bcrypt.hash(password, 12) },
  });

  resetTokens.delete(token);

  res.json({
    success: true,
    message: 'Password reset successfully. You can now login with your new password.',
  });
}));

// ── GET /auth/verification-status ─────────────────────────────────────────────
router.get('/verification-status', (req, res) => {
  res.json({
    success: true,
    data: { emailVerificationRequired: isVerificationRequired() },
  });
});

export default router;
