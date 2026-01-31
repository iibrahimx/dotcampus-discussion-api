const { z } = require("zod");

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  password: z.string().min(8).max(72), // max 72 because bcrypt effectively only uses first 72 bytes
});

module.exports = { registerSchema };
