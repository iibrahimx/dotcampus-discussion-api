const rateLimit = require("express-rate-limit");

const shouldSkipRateLimit = () => process.env.NODE_ENV === "test";

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
});

module.exports = { apiLimiter, authLimiter };
