const express = require("express");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");
const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth/auth.routes");

const app = express();

// Use middleware to read JSON bodies
app.use(express.json());

app.use("/api/v1", healthRoutes);
app.use("/api/v1", authRoutes);

// 404 error handler
app.use(notFound);

// General error handler
app.use(errorHandler);

module.exports = app;
