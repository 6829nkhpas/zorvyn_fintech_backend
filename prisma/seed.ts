import { PrismaClient, Role, UserStatus, RecordType } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import * as bcrypt from "bcryptjs";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Seed Data

const SALT_ROUNDS = 12;

interface SeedUser {
  name: string;
  email: string;
  password: string;
  role: Role;
}

const seedUsers: SeedUser[] = [
  {
    name: "Arjun Mehta",
    email: "admin@zorvyn.com",
    password: "Admin@1234",
    role: Role.Admin,
  },
  {
    name: "Priya Sharma",
    email: "analyst@zorvyn.com",
    password: "Analyst@1234",
    role: Role.Analyst,
  },
  {
    name: "Ravi Kumar",
    email: "viewer@zorvyn.com",
    password: "Viewer@1234",
    role: Role.Viewer,
  },
];

interface SeedRecord {
  amount: string; // String to preserve decimal precision
  type: RecordType;
  category: string;
  date: Date;
  notes: string | null;
  creatorEmail: string; // Resolved to userId at insert time
}

const seedRecords: SeedRecord[] = [
  {
    amount: "150000.00",
    type: RecordType.income,
    category: "Client Payment",
    date: new Date("2026-01-15"),
    notes: "Q1 consulting invoice — Tata Digital",
    creatorEmail: "admin@zorvyn.com",
  },
  {
    amount: "42500.50",
    type: RecordType.expense,
    category: "Cloud Infrastructure",
    date: new Date("2026-01-20"),
    notes: "AWS monthly billing — production cluster",
    creatorEmail: "admin@zorvyn.com",
  },
  {
    amount: "8750.00",
    type: RecordType.expense,
    category: "Office Supplies",
    date: new Date("2026-02-03"),
    notes: "Ergonomic desks and monitors for new hires",
    creatorEmail: "analyst@zorvyn.com",
  },
  {
    amount: "275000.00",
    type: RecordType.income,
    category: "Product Revenue",
    date: new Date("2026-02-10"),
    notes: "SaaS subscription revenue — February batch",
    creatorEmail: "admin@zorvyn.com",
  },
  {
    amount: "18200.75",
    type: RecordType.expense,
    category: "Marketing",
    date: new Date("2026-02-14"),
    notes: "Google Ads campaign — fintech awareness",
    creatorEmail: "analyst@zorvyn.com",
  },
  {
    amount: "95000.00",
    type: RecordType.income,
    category: "Consulting",
    date: new Date("2026-02-28"),
    notes: "Advisory retainer — Reliance Industries",
    creatorEmail: "admin@zorvyn.com",
  },
  {
    amount: "3200.00",
    type: RecordType.expense,
    category: "Software Licenses",
    date: new Date("2026-03-01"),
    notes: "Annual Figma and Notion team licenses",
    creatorEmail: "analyst@zorvyn.com",
  },
  {
    amount: "62000.00",
    type: RecordType.expense,
    category: "Payroll",
    date: new Date("2026-03-05"),
    notes: "March contractor payroll — backend team",
    creatorEmail: "admin@zorvyn.com",
  },
  {
    amount: "185000.00",
    type: RecordType.income,
    category: "Client Payment",
    date: new Date("2026-03-12"),
    notes: "Milestone payment — Zorvyn Pay integration",
    creatorEmail: "admin@zorvyn.com",
  },
  {
    amount: "11350.25",
    type: RecordType.expense,
    category: "Travel",
    date: new Date("2026-03-20"),
    notes: "Bangalore → Mumbai — client pitch trip",
    creatorEmail: "analyst@zorvyn.com",
  },
];

// Seed Execution

async function main() {
  console.log("🌱 Seeding Zorvyn Finance database...\n");

  // 1. Upsert users (idempotent — safe to re-run)
  const userMap = new Map<string, number>();

  for (const user of seedUsers) {
    const hash = await bcrypt.hash(user.password, SALT_ROUNDS);
    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role, password_hash: hash },
      create: {
        name: user.name,
        email: user.email,
        password_hash: hash,
        role: user.role,
        status: UserStatus.active,
      },
    });
    userMap.set(user.email, created.id);
    console.log(`  ✓ User: ${created.name} (${created.role}) — ${created.email}`);
  }

  // 2. Clear existing records and re-seed (idempotent)
  await prisma.financialRecord.deleteMany();
  console.log("\n  ✓ Cleared existing financial records");

  // 3. Insert financial records
  for (const record of seedRecords) {
    const creatorId = userMap.get(record.creatorEmail);
    if (!creatorId) {
      throw new Error(`Creator not found for email: ${record.creatorEmail}`);
    }

    await prisma.financialRecord.create({
      data: {
        amount: record.amount,
        type: record.type,
        category: record.category,
        date: record.date,
        notes: record.notes,
        createdBy: creatorId,
      },
    });
  }

  console.log(`  ✓ Inserted ${seedRecords.length} financial records\n`);

  // 4. Summary
  const userCount = await prisma.user.count();
  const recordCount = await prisma.financialRecord.count();
  console.log(`📊 Seed complete: ${userCount} users, ${recordCount} records`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
