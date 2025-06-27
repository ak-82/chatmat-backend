const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ msg: "نامعتبر" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ msg: "رمز اشتباه" });

    const token = jwt.sign({ username }, "secret");
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "خطای سرور" });
  }
});

module.exports = router;
