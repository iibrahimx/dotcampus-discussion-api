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

describe("GET /discussions", () => {
  it("should return 401 without token", async () => {
    const response = await request(app).get("/api/v1/discussions");
    expect(response.statusCode).toBe(401);
  });

  it("should return 200 and an array with valid token", async () => {
    const unique = Date.now();
    const email = `disc${unique}@example.com`;
    const username = `discuser${unique}`;
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
      .get("/api/v1/discussions")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});

describe("POST /discussions", () => {
  it("should return 401 without token", async () => {
    const response = await request(app).post("/api/v1/discussions").send({
      title: "My first post",
      content: "Hello world",
    });

    expect(response.statusCode).toBe(401);
  });

  it("should create a discussion with valid token", async () => {
    const unique = Date.now();
    const email = `disccreate${unique}@example.com`;
    const username = `disccreateuser${unique}`;
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
      .post("/api/v1/discussions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: `Discussion ${unique}`,
        content: "This is my first discussion content",
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.title).toBe(`Discussion ${unique}`);
    expect(response.body).toHaveProperty("authorId");
  });

  it("should return 400 for invalid discussion body", async () => {
    const unique = Date.now();
    const email = `discinvalid${unique}@example.com`;
    const username = `discinvaliduser${unique}`;
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
      .post("/api/v1/discussions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Hi", // too short (min 3)
        content: "",
      });

    expect(response.statusCode).toBe(400);
  });
});

describe("GET /discussions/:id", () => {
  it("should return 401 without token", async () => {
    const response = await request(app).get("/api/v1/discussions/some-id");
    expect(response.statusCode).toBe(401);
  });

  it("should return 404 if discussion does not exist", async () => {
    const unique = Date.now();
    const email = `single${unique}@example.com`;
    const username = `singleuser${unique}`;
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
      .get("/api/v1/discussions/nonexistent-id")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });

  it("should return discussion with comments array", async () => {
    const unique = Date.now();
    const email = `singleok${unique}@example.com`;
    const username = `singleokuser${unique}`;
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

    // create discussion
    const created = await request(app)
      .post("/api/v1/discussions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: `My Discussion ${unique}`,
        content: "Some content",
      });

    const discussionId = created.body.id;

    // fetch it
    const response = await request(app)
      .get(`/api/v1/discussions/${discussionId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body.id).toBe(discussionId);
    expect(response.body).toHaveProperty("comments");
    expect(Array.isArray(response.body.comments)).toBe(true);
  });
});

describe("PATCH /discussions/:id", () => {
  it("should return 401 without token", async () => {
    const response = await request(app)
      .patch("/api/v1/discussions/some-id")
      .send({ title: "New title" });

    expect(response.statusCode).toBe(401);
  });

  it("learner should update own discussion", async () => {
    const unique = Date.now();
    const email = `ownupd${unique}@example.com`;
    const username = `ownupduser${unique}`;
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

    const created = await request(app)
      .post("/api/v1/discussions")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Original", content: "Original content" });

    const discussionId = created.body.id;

    const updated = await request(app)
      .patch(`/api/v1/discussions/${discussionId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Updated title" });

    expect(updated.statusCode).toBe(200);
    expect(updated.body.title).toBe("Updated title");
  });

  it("learner should not update someone else's discussion (403)", async () => {
    const unique = Date.now();

    // User A creates discussion
    const emailA = `usera${unique}@example.com`;
    const usernameA = `usera${unique}`;
    const password = "password123";

    await request(app).post("/api/v1/auth/register").send({
      email: emailA,
      username: usernameA,
      password,
    });

    const loginA = await request(app).post("/api/v1/auth/login").send({
      email: emailA,
      password,
    });

    const tokenA = loginA.body.token;

    const created = await request(app)
      .post("/api/v1/discussions")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "A post", content: "A content" });

    const discussionId = created.body.id;

    // User B tries to update
    const emailB = `userb${unique}@example.com`;
    const usernameB = `userb${unique}`;

    await request(app).post("/api/v1/auth/register").send({
      email: emailB,
      username: usernameB,
      password,
    });

    const loginB = await request(app).post("/api/v1/auth/login").send({
      email: emailB,
      password,
    });

    const tokenB = loginB.body.token;

    const updated = await request(app)
      .patch(`/api/v1/discussions/${discussionId}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ title: "Hacked title" });

    expect(updated.statusCode).toBe(403);
  });
});

describe("DELETE /discussions/:id", () => {
  it("should return 401 without token", async () => {
    const response = await request(app).delete("/api/v1/discussions/some-id");

    expect(response.statusCode).toBe(401);
  });

  it("learner should delete own discussion", async () => {
    const unique = Date.now();
    const email = `delown${unique}@example.com`;
    const username = `delown${unique}`;
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

    const created = await request(app)
      .post("/api/v1/discussions")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "To delete", content: "Delete me" });

    const discussionId = created.body.id;

    const deleted = await request(app)
      .delete(`/api/v1/discussions/${discussionId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(deleted.statusCode).toBe(204);
  });

  it("learner should not delete someone else's discussion (403)", async () => {
    const unique = Date.now();
    const password = "password123";

    // User A
    const emailA = `delA${unique}@example.com`;
    const usernameA = `delA${unique}`;

    await request(app).post("/api/v1/auth/register").send({
      email: emailA,
      username: usernameA,
      password,
    });

    const loginA = await request(app).post("/api/v1/auth/login").send({
      email: emailA,
      password,
    });

    const tokenA = loginA.body.token;

    const created = await request(app)
      .post("/api/v1/discussions")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "A post", content: "A content" });

    const discussionId = created.body.id;

    // User B
    const emailB = `delB${unique}@example.com`;
    const usernameB = `delB${unique}`;

    await request(app).post("/api/v1/auth/register").send({
      email: emailB,
      username: usernameB,
      password,
    });

    const loginB = await request(app).post("/api/v1/auth/login").send({
      email: emailB,
      password,
    });

    const tokenB = loginB.body.token;

    const deleted = await request(app)
      .delete(`/api/v1/discussions/${discussionId}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(deleted.statusCode).toBe(403);
  });
});

describe("POST /discussions/:id/comments", () => {
  it("should return 401 without token", async () => {
    const response = await request(app)
      .post("/api/v1/discussions/some-id/comments")
      .send({ content: "Hi" });

    expect(response.statusCode).toBe(401);
  });

  it("should return 404 if discussion does not exist", async () => {
    const unique = Date.now();
    const email = `c404${unique}@example.com`;
    const username = `c404user${unique}`;
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
      .post("/api/v1/discussions/nonexistent/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({ content: "Hello" });

    expect(response.statusCode).toBe(404);
  });

  it("should create a comment on a discussion", async () => {
    const unique = Date.now();
    const email = `cok${unique}@example.com`;
    const username = `cokuser${unique}`;
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

    const createdDiscussion = await request(app)
      .post("/api/v1/discussions")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Commentable", content: "Post content" });

    const discussionId = createdDiscussion.body.id;

    const response = await request(app)
      .post(`/api/v1/discussions/${discussionId}/comments`)
      .set("Authorization", `Bearer ${token}`)
      .send({ content: "First comment" });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.content).toBe("First comment");
    expect(response.body.discussionId).toBe(discussionId);
  });

  it("should return 400 for invalid comment body", async () => {
    const unique = Date.now();
    const email = `cbad${unique}@example.com`;
    const username = `cbaduser${unique}`;
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

    const createdDiscussion = await request(app)
      .post("/api/v1/discussions")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Bad comment", content: "Post content" });

    const discussionId = createdDiscussion.body.id;

    const response = await request(app)
      .post(`/api/v1/discussions/${discussionId}/comments`)
      .set("Authorization", `Bearer ${token}`)
      .send({ content: "" });

    expect(response.statusCode).toBe(400);
  });
});

describe("Admin bootstrap", () => {
  it("should assign ADMIN role when registering bootstrap email", async () => {
    const unique = Date.now();
    const email = "admin@example.com"; // must match .env
    const username = `adminuser${unique}`;

    const response = await request(app).post("/api/v1/auth/register").send({
      email,
      username,
      password: "password123",
    });

    expect([201, 409]).toContain(response.statusCode);

    // If it was newly created
    if (response.statusCode === 201) {
      expect(response.body.role).toBe("ADMIN");
    }
  });
});

describe("DELETE /comments/:id (admin)", () => {
  it("should return 401 without token", async () => {
    const response = await request(app).delete("/api/v1/comments/some-id");
    expect(response.statusCode).toBe(401);
  });

  it("should return 403 for non-admin user", async () => {
    const unique = Date.now();
    const email = `notadmin${unique}@example.com`;
    const username = `notadmin${unique}`;
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
      .delete("/api/v1/comments/some-id")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(403);
  });

  it("admin should delete a comment", async () => {
    const unique = Date.now();
    const adminEmail = "admin@example.com"; // must match ADMIN_BOOTSTRAP_EMAIL in .env
    const adminUsername = `admin${unique}`;
    const password = "password123";

    // Register admin (if already exists, ignore 409)
    const reg = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      username: adminUsername,
      password,
    });

    expect([201, 409]).toContain(reg.statusCode);

    const loginAdmin = await request(app).post("/api/v1/auth/login").send({
      email: adminEmail,
      password,
    });

    const adminToken = loginAdmin.body.token;

    // Create a learner + discussion + comment
    const learnerEmail = `learner${unique}@example.com`;
    const learnerUsername = `learner${unique}`;

    await request(app).post("/api/v1/auth/register").send({
      email: learnerEmail,
      username: learnerUsername,
      password,
    });

    const learnerLogin = await request(app).post("/api/v1/auth/login").send({
      email: learnerEmail,
      password,
    });

    const learnerToken = learnerLogin.body.token;

    const createdDiscussion = await request(app)
      .post("/api/v1/discussions")
      .set("Authorization", `Bearer ${learnerToken}`)
      .send({ title: "Admin delete comment", content: "Post content" });

    const discussionId = createdDiscussion.body.id;

    const createdComment = await request(app)
      .post(`/api/v1/discussions/${discussionId}/comments`)
      .set("Authorization", `Bearer ${learnerToken}`)
      .send({ content: "This will be deleted" });

    const commentId = createdComment.body.id;

    // Admin deletes comment
    const deleted = await request(app)
      .delete(`/api/v1/comments/${commentId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(deleted.statusCode).toBe(204);
  });
});

describe("Admin deletes any discussion", () => {
  it("admin should delete someone else's discussion", async () => {
    const unique = Date.now();
    const password = "password123";

    // Ensure admin exists and login admin
    const adminEmail = "admin@example.com"; // matches ADMIN_BOOTSTRAP_EMAIL
    const adminUsername = `adminDel${unique}`;

    const regAdmin = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      username: adminUsername,
      password,
    });

    expect([201, 409]).toContain(regAdmin.statusCode);

    const loginAdmin = await request(app).post("/api/v1/auth/login").send({
      email: adminEmail,
      password,
    });

    const adminToken = loginAdmin.body.token;

    // Create a learner + discussion
    const learnerEmail = `victim${unique}@example.com`;
    const learnerUsername = `victim${unique}`;

    await request(app).post("/api/v1/auth/register").send({
      email: learnerEmail,
      username: learnerUsername,
      password,
    });

    const loginLearner = await request(app).post("/api/v1/auth/login").send({
      email: learnerEmail,
      password,
    });

    const learnerToken = loginLearner.body.token;

    const created = await request(app)
      .post("/api/v1/discussions")
      .set("Authorization", `Bearer ${learnerToken}`)
      .send({ title: "Admin will delete", content: "To be removed" });

    const discussionId = created.body.id;

    // Admin deletes learner's discussion
    const deleted = await request(app)
      .delete(`/api/v1/discussions/${discussionId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(deleted.statusCode).toBe(204);
  });
});

describe("PATCH /users/:id/role (admin)", () => {
  it("should return 401 without token", async () => {
    const response = await request(app)
      .patch("/api/v1/users/some-id/role")
      .send({ role: "MENTOR" });

    expect(response.statusCode).toBe(401);
  });

  it("should return 403 for non-admin", async () => {
    const unique = Date.now();
    const password = "password123";

    const email = `roleuser${unique}@example.com`;
    const username = `roleuser${unique}`;

    const reg = await request(app).post("/api/v1/auth/register").send({
      email,
      username,
      password,
    });

    const userId = reg.body.id;

    const login = await request(app).post("/api/v1/auth/login").send({
      email,
      password,
    });

    const token = login.body.token;

    const response = await request(app)
      .patch(`/api/v1/users/${userId}/role`)
      .set("Authorization", `Bearer ${token}`)
      .send({ role: "MENTOR" });

    expect(response.statusCode).toBe(403);
  });

  it("admin should change a user role to MENTOR", async () => {
    const unique = Date.now();
    const password = "password123";

    // Admin login (bootstrap admin)
    const adminEmail = "admin@example.com";
    const adminUsername = `adminRole${unique}`;

    const regAdmin = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      username: adminUsername,
      password,
    });

    expect([201, 409]).toContain(regAdmin.statusCode);

    const loginAdmin = await request(app).post("/api/v1/auth/login").send({
      email: adminEmail,
      password,
    });

    const adminToken = loginAdmin.body.token;

    // Create learner
    const email = `learnerrole${unique}@example.com`;
    const username = `learnerrole${unique}`;

    const reg = await request(app).post("/api/v1/auth/register").send({
      email,
      username,
      password,
    });

    const userId = reg.body.id;

    // Admin changes role
    const response = await request(app)
      .patch(`/api/v1/users/${userId}/role`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "MENTOR" });

    expect(response.statusCode).toBe(200);
    expect(response.body.role).toBe("MENTOR");
  });
});

describe("Mentor permissions", () => {
  it("mentor should update someone else's discussion", async () => {
    const unique = Date.now();
    const password = "password123";

    // Admin login
    const adminEmail = "admin@example.com";
    const regAdmin = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: adminEmail,
        username: `adminMentorTest${unique}`,
        password,
      });
    expect([201, 409]).toContain(regAdmin.statusCode);

    const loginAdmin = await request(app).post("/api/v1/auth/login").send({
      email: adminEmail,
      password,
    });
    const adminToken = loginAdmin.body.token;

    // User A (learner) creates discussion
    const emailA = `author${unique}@example.com`;
    const usernameA = `author${unique}`;

    await request(app).post("/api/v1/auth/register").send({
      email: emailA,
      username: usernameA,
      password,
    });

    const loginA = await request(app).post("/api/v1/auth/login").send({
      email: emailA,
      password,
    });

    const tokenA = loginA.body.token;

    const created = await request(app)
      .post("/api/v1/discussions")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Original title", content: "Original content" });

    const discussionId = created.body.id;

    // User B becomes mentor
    const emailB = `mentor${unique}@example.com`;
    const usernameB = `mentor${unique}`;

    const regB = await request(app).post("/api/v1/auth/register").send({
      email: emailB,
      username: usernameB,
      password,
    });

    const userBId = regB.body.id;

    // Admin promotes B to MENTOR
    const promoted = await request(app)
      .patch(`/api/v1/users/${userBId}/role`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "MENTOR" });

    expect(promoted.statusCode).toBe(200);
    expect(promoted.body.role).toBe("MENTOR");

    // Mentor logs in and updates A's discussion
    const loginB = await request(app).post("/api/v1/auth/login").send({
      email: emailB,
      password,
    });

    const mentorToken = loginB.body.token;

    const updated = await request(app)
      .patch(`/api/v1/discussions/${discussionId}`)
      .set("Authorization", `Bearer ${mentorToken}`)
      .send({ title: "Mentor edited title" });

    expect(updated.statusCode).toBe(200);
    expect(updated.body.title).toBe("Mentor edited title");
  });
});

describe("DELETE /users/:id (admin)", () => {
  it("should return 401 without token", async () => {
    const response = await request(app).delete("/api/v1/users/some-id");
    expect(response.statusCode).toBe(401);
  });

  it("should return 403 for non-admin", async () => {
    const unique = Date.now();
    const password = "password123";

    const email = `nonadmindel${unique}@example.com`;
    const username = `nonadmindel${unique}`;

    const reg = await request(app).post("/api/v1/auth/register").send({
      email,
      username,
      password,
    });

    const userId = reg.body.id;

    const login = await request(app).post("/api/v1/auth/login").send({
      email,
      password,
    });

    const token = login.body.token;

    const response = await request(app)
      .delete(`/api/v1/users/${userId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(403);
  });

  it("admin should delete a user", async () => {
    const unique = Date.now();
    const password = "password123";

    // Admin login
    const adminEmail = "admin@example.com";
    const regAdmin = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: adminEmail,
        username: `adminUserDel${unique}`,
        password,
      });
    expect([201, 409]).toContain(regAdmin.statusCode);

    const loginAdmin = await request(app).post("/api/v1/auth/login").send({
      email: adminEmail,
      password,
    });
    const adminToken = loginAdmin.body.token;

    // Create victim user
    const email = `victimdel${unique}@example.com`;
    const username = `victimdel${unique}`;

    const regVictim = await request(app).post("/api/v1/auth/register").send({
      email,
      username,
      password,
    });

    const victimId = regVictim.body.id;

    // Admin deletes victim
    const deleted = await request(app)
      .delete(`/api/v1/users/${victimId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(deleted.statusCode).toBe(204);
  });
});

describe("Rate limiting", () => {
  it("should allow a normal request under rate limit", async () => {
    const response = await request(app).get("/api/v1/health");
    expect(response.statusCode).toBe(200);
  });
});

afterAll(async () => {
  const { disconnectPrisma } = require("../src/config/prisma");
  await disconnectPrisma();
});
