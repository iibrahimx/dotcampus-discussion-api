const express = require("express");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// Use middleware to read JSON bodies
app.use(express.json());

// Register a route handler
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// 404 error handler
app.use(notFound);

// General error handler
app.use(errorHandler);

module.exports = app;
