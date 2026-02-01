const express = require("express");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");
const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth/auth.routes");
const protectedRoutes = require("./routes/protected.routes");
const discussionRoutes = require("./routes/discussions/discussions.routes");
const commentRoutes = require("./routes/comments/comments.routes");
const userRoutes = require("./routes/users/users.routes");
const { apiLimiter, authLimiter } = require("./middlewares/rateLimiters");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const app = express();

// Use middleware to read JSON bodies
app.use(express.json());

app.use("/api", apiLimiter);
app.use("/api/v1/auth", authLimiter);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/v1", healthRoutes);
app.use("/api/v1", authRoutes);
app.use("/api/v1", protectedRoutes);
app.use("/api/v1", discussionRoutes);
app.use("/api/v1", commentRoutes);
app.use("/api/v1", userRoutes);

// 404 error handler
app.use(notFound);

// General error handler
app.use(errorHandler);

module.exports = app;
