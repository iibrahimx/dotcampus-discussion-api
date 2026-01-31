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
