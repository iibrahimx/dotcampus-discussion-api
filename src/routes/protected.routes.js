const express = require("express");
const requireAuth = require("../middlewares/requireAuth");

const router = express.Router();

router.get("/protected", requireAuth, (req, res) => {
  res.status(200).json({
    message: "You are authenticated",
    user: req.user,
  });
});

module.exports = router;
