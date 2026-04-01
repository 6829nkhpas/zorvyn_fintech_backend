import { describe, it, expect, beforeAll } from "@jest/globals";
import supertest from "supertest";
import { app } from "../app";
import { testUsers, prismaTest } from "./setup";
import { RecordType } from "../generated/prisma";

const request = supertest(app);

describe("Dashboard Integration Tests", () => {
  let viewerToken: string;

  beforeAll(async () => {
    // Generate some test data to ensure dashboard has something to calculate
    await prismaTest.financialRecord.createMany({
      data: [
        { amount: 1500, type: RecordType.income, category: "Salary", date: new Date(), createdBy: testUsers.admin.id },
        { amount: 500, type: RecordType.expense, category: "Groceries", date: new Date(), createdBy: testUsers.admin.id }
      ]
    });

    const res = await request.post("/api/auth/login").send({ email: testUsers.viewer.email, password: "Password!123" });
    viewerToken = res.body.data.token;
  });

  it("should successfully return 5 expected metrics for Viewer", async () => {
    const res = await request.get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${viewerToken}`);
      
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    
    // Check for the 5 requested metrics
    expect(res.body.data).toHaveProperty("totalIncome");
    expect(res.body.data).toHaveProperty("totalExpenses");
    expect(res.body.data).toHaveProperty("netBalance");
    expect(res.body.data).toHaveProperty("categoryBreakdown");
    expect(res.body.data).toHaveProperty("recentActivity");
  });
});
