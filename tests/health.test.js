process.env.NODE_ENV = "development";

const request = require("supertest");
const app = require("../src/app");

describe("API basics", () => {
  it("should return status ok", async () => {
    const response = await request(app).get("/api/v1/health");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("should return 404 for unknown routes", async () => {
    const response = await request(app).get("/does-not-exist");

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("Not Found");
  });

  it("should return 500 and json for thrown errors", async () => {
    const response = await request(app).get("/api/v1/debug/error");

    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("Intentional test error");
  });
});

describe("POST /auth/register", () => {
  it("should register a new user successfully", async () => {
    const unique = Date.now();

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: `test${unique}@example.com`,
        username: `testuser${unique}`,
        password: "password123",
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.email).toBe(`test${unique}@example.com`);
    expect(response.body).not.toHaveProperty("password");
  });

  // Test for duplicates
  it("should not allow duplicate email", async () => {
    const unique = Date.now();
    const email = `dup${unique}@example.com`;

    await request(app)
      .post("/api/v1/auth/register")
      .send({
        email,
        username: `first${unique}`,
        password: "password123",
      });

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email,
        username: `second${unique}`,
        password: "password123",
      });

    expect(response.statusCode).toBe(409);
  });

  it("should return 400 for invalid data", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({
      email: "invalid-email",
      username: "ab",
      password: "123",
    });

    expect(response.statusCode).toBe(400);
  });
});

afterAll(async () => {
  const { disconnectPrisma } = require("../src/config/prisma");
  await disconnectPrisma();
});
