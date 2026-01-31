const express = require("express");

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

router.get("/debug/error", (req, res) => {
  throw new Error("Intentional test error");
});

module.exports = router;
