import { describe, it, expect } from "@jest/globals";
import supertest from "supertest";
import { app } from "../app";
import { testUsers } from "./setup";

const request = supertest(app);

describe("Auth Integration Tests", () => {
  it("should successfully log in a valid user", async () => {
    const res = await request.post("/api/auth/login").send({
      email: testUsers.admin.email,
      password: "Password!123"
    });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("token");
  });

  it("should return 401 for invalid credentials", async () => {
    const res = await request.post("/api/auth/login").send({
      email: testUsers.admin.email,
      password: "WrongPassword123"
    });
    
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 validation error for missing fields", async () => {
    const res = await request.post("/api/auth/login").send({
      email: testUsers.admin.email
    });
    
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
  });
});
