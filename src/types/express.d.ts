// ─────────────────────────────────────────────────────────
// Express Request Augmentation
// Adds typed `user` property set by the auth middleware.
// ─────────────────────────────────────────────────────────

import { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: Role;
      };
    }
  }
}
