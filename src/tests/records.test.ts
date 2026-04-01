import { describe, it, expect, beforeAll } from "@jest/globals";
import supertest from "supertest";
import { app } from "../app";
import { testUsers, prismaTest } from "./setup";
import { RecordType } from "../generated/prisma";

const request = supertest(app);

describe("Records Integration Tests", () => {
  let adminToken: string;
  let analystToken: string;
  let viewerToken: string;
  let recordId: number;

  beforeAll(async () => {
    // Obtain tokens
    let res = await request.post("/api/auth/login").send({ email: testUsers.admin.email, password: "Password!123" });
    adminToken = res.body.data.token;

    res = await request.post("/api/auth/login").send({ email: testUsers.analyst.email, password: "Password!123" });
    analystToken = res.body.data.token;

    res = await request.post("/api/auth/login").send({ email: testUsers.viewer.email, password: "Password!123" });
    viewerToken = res.body.data.token;
  });

  it("should allow Admin to create a record", async () => {
    const res = await request.post("/api/records")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        amount: 1000,
        type: RecordType.income,
        category: "Test Income",
        date: new Date().toISOString().split("T")[0],
        notes: "Test note"
      });
      
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    recordId = res.body.data.id;
  });

  it("should allow Admin to update a record", async () => {
    const res = await request.put(`/api/records/${recordId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        amount: 2000
      });
      
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Depending on Prisma serialization of Decimal, it might be a string or number
    expect(Number(res.body.data.amount)).toBe(2000);
  });

  it("should allow Admin to delete a record", async () => {
    const res = await request.delete(`/api/records/${recordId}`)
      .set("Authorization", `Bearer ${adminToken}`);
      
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should return 403 Forbidden for Viewer attempting to access GET /api/records", async () => {
    const res = await request.get("/api/records")
      .set("Authorization", `Bearer ${viewerToken}`);
      
    expect(res.status).toBe(403);
  });

  it("should return 403 Forbidden for Analyst attempting to POST /api/records", async () => {
    const res = await request.post("/api/records")
      .set("Authorization", `Bearer ${analystToken}`)
      .send({
        amount: 100,
        type: RecordType.expense,
        category: "Test",
        date: "2026-01-01"
      });
      
    expect(res.status).toBe(403);
  });

  it("should test filtering and pagination on GET /api/records", async () => {
    // Seed some test records
    await prismaTest.financialRecord.createMany({
      data: [
        { amount: 500, type: RecordType.income, category: "Filter", date: new Date("2026-01-01"), createdBy: testUsers.admin.id },
        { amount: 300, type: RecordType.expense, category: "Filter", date: new Date("2026-01-02"), createdBy: testUsers.admin.id },
        { amount: 200, type: RecordType.income, category: "Filter", date: new Date("2026-01-03"), createdBy: testUsers.admin.id }
      ]
    });

    const res = await request.get("/api/records?type=income&limit=1")
      .set("Authorization", `Bearer ${adminToken}`);
      
    // Expected to get a 200 and a paginated format
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    
    // If the data is paginated { records: [...], meta: {...} } or just [...]
    const records = Array.isArray(res.body.data) ? res.body.data : res.body.data.records || res.body.data.data;
    
    expect(records.length).toBeLessThanOrEqual(1);
    expect(records.some((r: any) => r.type === "expense")).toBe(false);
  });
});
