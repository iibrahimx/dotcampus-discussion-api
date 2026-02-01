const { z } = require("zod");

const createDiscussionSchema = z.object({
  title: z.string().min(3).max(120),
  content: z.string().min(1).max(5000),
});

module.exports = { createDiscussionSchema };
