const express = require("express");
const bcrypt = require("bcrypt");
const {
  registerSchema,
  loginSchema,
} = require("../../validators/auth.validators");
const { prisma } = require("../../config/prisma");
const jwt = require("jsonwebtoken");

const router = express.Router();

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, username, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: test@example.com
 *               username:
 *                 type: string
 *                 example: testuser
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Duplicate email/username
 */

router.post("/auth/register", async (req, res, next) => {
  try {
    // Vaidate input
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "ValidationError",
        message: parsed.error.issues.map((i) => i.message),
      });
    }

    const { email, username, password } = parsed.data;

    // Check for duplicates
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        error: "Conflict",
        message: "Email or username already exists",
      });
    }

    // Hash passowrd
    const hashedPassword = await bcrypt.hash(password, 10);

    const role =
      process.env.ADMIN_BOOTSTRAP_EMAIL &&
      email.toLowerCase() === process.env.ADMIN_BOOTSTRAP_EMAIL.toLowerCase()
        ? "ADMIN"
        : "LEARNER";

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Return safe response
    res.status(201).json({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/auth/login", async (req, res, next) => {
  try {
    // Validate input with zod
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "ValidationError",
        message: parsed.error.issues.map((i) => i.message),
      });
    }

    const { email, password } = parsed.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid credentials",
      });
    }

    // Compare password using bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid credentials",
      });
    }

    // Create token using jwt
    const token = jwt.sign(
      { sub: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" },
    );

    // Return token and safe user object
    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
