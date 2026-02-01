const express = require("express");
const requireAuth = require("../../middlewares/requireAuth");

const router = express.Router();

// Placeholder: list discussions (protected)
router.get("/discussions", requireAuth, (req, res) => {
  res.status(501).json({ message: "Not implemented yet" });
});

module.exports = router;
