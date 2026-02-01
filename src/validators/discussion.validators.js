const { z } = require("zod");

const createDiscussionSchema = z.object({
  title: z.string().min(3).max(120),
  content: z.string().min(1).max(5000),
});

const updateDiscussionSchema = z
  .object({
    title: z.string().min(3).max(120).optional(),
    content: z.string().min(1).max(5000).optional(),
  })
  .refine((data) => data.title || data.content, {
    message: "At least one of title or content must be provided",
  });

module.exports = { createDiscussionSchema, updateDiscussionSchema };
