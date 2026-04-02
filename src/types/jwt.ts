
// Auth Token Payload — Type Definition
// Shared across auth service, middleware, and any module
// that reads the decoded token.
//
// Named "AuthTokenPayload" to avoid collision with the
// JwtPayload type exported by @types/jsonwebtoken.


import type { Role } from "../generated/prisma/index.js";

// The payload encoded inside every JWT issued by the auth service.
// Kept intentionally minimal — never include password_hash or PII.

export interface AuthTokenPayload {
  // User primary key
  sub: number;
  // User email (for convenience; authoritative source is the DB)
  email: string;
  // User role for RBAC checks
  role: Role;
  // Standard JWT claims auto-added by jsonwebtoken
  iat?: number;
  exp?: number;
}
