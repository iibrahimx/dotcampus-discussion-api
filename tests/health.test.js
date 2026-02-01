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

describe("POST /auth/login", () => {
  it("should login and return a token", async () => {
    const unique = Date.now();
    const email = `login${unique}@example.com`;
    const username = `loginuser${unique}`;
    const password = "password123";

    // register first
    await request(app).post("/api/v1/auth/register").send({
      email,
      username,
      password,
    });

    // login
    const response = await request(app).post("/api/v1/auth/login").send({
      email,
      password,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("token");
    expect(typeof response.body.token).toBe("string");
    expect(response.body).toHaveProperty("user");
    expect(response.body.user.email).toBe(email);
  });

  it("should return 401 for wrong password", async () => {
    const unique = Date.now();
    const email = `wrongpass${unique}@example.com`;
    const username = `wrongpassuser${unique}`;

    await request(app).post("/api/v1/auth/register").send({
      email,
      username,
      password: "password123",
    });

    const response = await request(app).post("/api/v1/auth/login").send({
      email,
      password: "password124",
    });

    expect(response.statusCode).toBe(401);
  });

  it("should return 400 for invalid login body", async () => {
    const response = await request(app).post("/api/v1/auth/login").send({
      email: "not-an-email",
      password: "123",
    });

    expect(response.statusCode).toBe(400);
  });
});

describe("GET /protected", () => {
  it("should return 401 without token", async () => {
    const response = await request(app).get("/api/v1/protected");
    expect(response.statusCode).toBe(401);
  });

  it("should return 200 with valid token", async () => {
    const unique = Date.now();
    const email = `mid${unique}@example.com`;
    const username = `miduser${unique}`;
    const password = "password123";

    await request(app).post("/api/v1/auth/register").send({
      email,
      username,
      password,
    });

    const login = await request(app).post("/api/v1/auth/login").send({
      email,
      password,
    });

    const token = login.body.token;

    const response = await request(app)
      .get("/api/v1/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("user");
    expect(response.body.user).toHaveProperty("id");
  });
});

afterAll(async () => {
  const { disconnectPrisma } = require("../src/config/prisma");
  await disconnectPrisma();
});
