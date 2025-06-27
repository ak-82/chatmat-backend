const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({

  sender: { type: String, required: true },
  text: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: String, enum: ["sent", "seen"], default: "sent" },
  deletedFor: { type: [String], default: [] },
  edited: { type: Boolean, default: false },  // اضافه شد
  replyTo: {
    _id: { type: String },
    text: { type: String },
    sender: { type: String },
  },
});

module.exports = mongoose.model("Message", messageSchema);
