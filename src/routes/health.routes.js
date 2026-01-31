const express = require("express");
const env = require("../config/env");

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

if (env.nodeEnv !== "production") {
  router.get("/debug/error", (req, res) => {
    throw new Error("Intentional test error");
  });
}

module.exports = router;
