const express = require("express");
const requireAuth = require("../../middlewares/requireAuth");
const { prisma } = require("../../config/prisma");
const {
  createDiscussionSchema,
} = require("../../validators/discussion.validators");

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

router.get("/discussions", requireAuth, (req, res) => {
  res.status(501).json({ message: "Not implemented yet" });
});

module.exports = router;
