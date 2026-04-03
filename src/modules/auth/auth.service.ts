// Auth Module — Service Layer
// Pure business logic: no HTTP concepts (req/res).

import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import type { AuthTokenPayload } from "../../types/jwt.js";

/**
 * Authenticate a user by email + password.
 * Returns a signed JWT on success; throws descriptive errors on failure.
 */
export async function login(
  email: string,
  password: string
): Promise<{ token: string }> {
  // 1. Look up user by email
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AuthError("Invalid email or password", 401);
  }

  // 2. Reject inactive accounts
  if (user.status === "inactive") {
    throw new AuthError("Account is deactivated. Contact an administrator.", 403);
  }

  // 3. Verify password hash
  const passwordValid = await bcrypt.compare(password, user.password_hash);

  if (!passwordValid) {
    throw new AuthError("Invalid email or password", 401);
  }

  // 4. Build JWT payload (minimal claims — no sensitive data)
  const payload: AuthTokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  const signOptions: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as unknown as number,
  };

  const token = jwt.sign(
    payload as unknown as object,
    env.JWT_SECRET,
    signOptions
  );

  return { token };
}

// Auth-specific error class

export class AuthError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}
