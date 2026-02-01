const express = require("express");
const requireAuth = require("../../middlewares/requireAuth");
const requireRole = require("../../middlewares/requireRole");
const { prisma } = require("../../config/prisma");

const router = express.Router();

router.patch(
  "/users/:id/role",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (role !== "LEARNER" && role !== "MENTOR") {
        return res.status(400).json({
          error: "ValidationError",
          message: ["Role must be either LEARNER or MENTOR"],
        });
      }

      const existing = await prisma.user.findUnique({
        where: { id },
        select: { id: true, email: true, username: true, role: true },
      });

      if (!existing) {
        return res.status(404).json({
          error: "Not Found",
          message: "User not found",
        });
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { role },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
