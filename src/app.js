const express = require("express");

const app = express();

// Use middleware to read JSON bodies
app.use(express.json());

// Register a route handler
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

module.exports = app;
