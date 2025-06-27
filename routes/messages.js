const express = require("express");
const router = express.Router();
const Message = require("../models/Message");

// دریافت همه پیام‌ها (فیلتر حذف شده‌ها با توجه به یوزر)
router.get("/", async (req, res) => {
  const username = req.query.username; // یوزرنیم از کوئری گرفته می‌شود

  try {
    const messages = await Message.find({
      deletedFor: { $ne: username } // پیام‌هایی که برای این یوزر حذف نشده‌اند
    }).sort({ _id: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ msg: "خطا در دریافت پیام‌ها" });
  }
});

// حذف برای خود کاربر (یک طرفه)
router.post("/delete-for-me", async (req, res) => {
  const { messageId, username } = req.body;
  try {
    await Message.findByIdAndUpdate(messageId, {
      $addToSet: { deletedFor: username },
    });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

// ویرایش پیام
router.post("/edit-message", async (req, res) => {
  const { messageId, newText } = req.body;
  try {
    const updated = await Message.findByIdAndUpdate(
      messageId,
      { text: newText, edited: true },
      { new: true }
    );
    res.json({ success: true, updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: "ویرایش پیام ناموفق بود" });
  }
});


// حذف برای همه (دوطرفه)
router.post("/delete-for-everyone", async (req, res) => {
  const { messageId } = req.body;
  try {
    await Message.findByIdAndDelete(messageId);
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
