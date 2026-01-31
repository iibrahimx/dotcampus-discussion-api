const express = require("express");
const bcrypt = require("bcrypt");
const { registerSchema } = require("../../validators/auth.validators");
const { prisma } = require("../../config/prisma");

const router = express.Router();

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

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
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

module.exports = router;
