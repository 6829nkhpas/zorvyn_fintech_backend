import { PrismaClient, Role, UserStatus } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as bcrypt from "bcryptjs";
import { env } from "../config/env";
import { beforeAll, afterAll } from "@jest/globals";

const pool = new Pool({ connectionString: env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const prismaTest = new PrismaClient({ adapter });

export const testUsers = {
  admin: { id: 0, email: "admin_test@zorvyn.com", password: "Password!123", role: Role.Admin },
  analyst: { id: 0, email: "analyst_test@zorvyn.com", password: "Password!123", role: Role.Analyst },
  viewer: { id: 0, email: "viewer_test@zorvyn.com", password: "Password!123", role: Role.Viewer }
};

beforeAll(async () => {
  // Clear tables to ensure isolation
  await prismaTest.financialRecord.deleteMany();
  await prismaTest.user.deleteMany();

  // Create users
  const hash = await bcrypt.hash("Password!123", 10);
  
  const admin = await prismaTest.user.create({
    data: { name: "Admin Test", email: testUsers.admin.email, password_hash: hash, role: testUsers.admin.role, status: UserStatus.active }
  });
  testUsers.admin.id = admin.id;

  const analyst = await prismaTest.user.create({
    data: { name: "Analyst Test", email: testUsers.analyst.email, password_hash: hash, role: testUsers.analyst.role, status: UserStatus.active }
  });
  testUsers.analyst.id = analyst.id;

  const viewer = await prismaTest.user.create({
    data: { name: "Viewer Test", email: testUsers.viewer.email, password_hash: hash, role: testUsers.viewer.role, status: UserStatus.active }
  });
  testUsers.viewer.id = viewer.id;
});

afterAll(async () => {
  await prismaTest.financialRecord.deleteMany();
  await prismaTest.user.deleteMany();
  await prismaTest.$disconnect();
});
