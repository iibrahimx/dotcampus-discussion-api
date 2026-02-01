const express = require("express");
const requireAuth = require("../../middlewares/requireAuth");
const { prisma } = require("../../config/prisma");
const {
  createDiscussionSchema,
  updateDiscussionSchema,
} = require("../../validators/discussion.validators");
const { createCommentSchema } = require("../../validators/comment.validators");

const router = express.Router();

router.post("/discussions", requireAuth, async (req, res, next) => {
  try {
    const parsed = createDiscussionSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "ValidationError",
        message: parsed.error.issues.map((i) => i.message),
      });
    }

    const { title, content } = parsed.data;

    const discussion = await prisma.discussion.create({
      data: {
        title,
        content,
        authorId: req.user.id,
      },
      select: {
        id: true,
        title: true,
        content: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(201).json(discussion);
  } catch (error) {
    next(error);
  }
});

router.get("/discussions", requireAuth, async (req, res, next) => {
  try {
    const discussions = await prisma.discussion.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        content: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    return res.status(200).json(discussions);
  } catch (error) {
    next(error);
  }
});

router.get("/discussions/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const discussion = await prisma.discussion.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        comments: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            content: true,
            authorId: true,
            createdAt: true,
            updatedAt: true,
            author: {
              select: {
                id: true,
                username: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!discussion) {
      return res.status(404).json({
        error: "Not Found",
        message: "Discussion not found",
      });
    }

    return res.status(200).json(discussion);
  } catch (error) {
    next(error);
  }
});

router.post(
  "/discussions/:id/comments",
  requireAuth,
  async (req, res, next) => {
    try {
      const { id: discussionId } = req.params;

      const parsed = createCommentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "ValidationError",
          message: parsed.error.issues.map((i) => i.message),
        });
      }

      // Ensure discussion exists
      const discussion = await prisma.discussion.findUnique({
        where: { id: discussionId },
        select: { id: true },
      });

      if (!discussion) {
        return res.status(404).json({
          error: "Not Found",
          message: "Discussion not found",
        });
      }

      const comment = await prisma.comment.create({
        data: {
          content: parsed.data.content,
          discussionId,
          authorId: req.user.id,
        },
        select: {
          id: true,
          content: true,
          discussionId: true,
          authorId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.status(201).json(comment);
    } catch (error) {
      next(error);
    }
  },
);

router.patch("/discussions/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const parsed = updateDiscussionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "ValidationError",
        message: parsed.error.issues.map((i) => i.message),
      });
    }

    const existing = await prisma.discussion.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    });

    if (!existing) {
      return res.status(404).json({
        error: "Not Found",
        message: "Discussion not found",
      });
    }

    const isOwner = existing.authorId === req.user.id;
    const isMentorOrAdmin =
      req.user.role === "MENTOR" || req.user.role === "ADMIN";

    if (!isOwner && !isMentorOrAdmin) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You are not allowed to update this discussion",
      });
    }

    const updated = await prisma.discussion.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        title: true,
        content: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete("/discussions/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.discussion.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    });

    if (!existing) {
      return res.status(404).json({
        error: "Not Found",
        message: "Discussion not found",
      });
    }

    const isOwner = existing.authorId === req.user.id;
    const isAdmin = req.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You are not allowed to delete this discussion",
      });
    }

    await prisma.discussion.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
