const express = require("express");
const requireAuth = require("../../middlewares/requireAuth");
const requireRole = require("../../middlewares/requireRole");
const { prisma } = require("../../config/prisma");

const router = express.Router();

// Admin deletes any comment
router.delete(
  "/comments/:id",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const existing = await prisma.comment.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!existing) {
        return res.status(404).json({
          error: "Not Found",
          message: "Comment not found",
        });
      }

      await prisma.comment.delete({ where: { id } });
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
