require('dotenv').config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const Message = require("./models/Message");

const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: ["http://localhost:5173", "https://your-frontend-domain.com"],
    methods: ["GET", "POST"],
  },
});

// اتصال به دیتابیس MongoDB
connectDB();

// میدلورها
app.use(cors());
app.use(express.json());

// روت‌های API
app.use("/api", authRoutes);
app.use("/api/messages", messageRoutes);

// مدیریت کاربران آنلاین و آخرین بازدید
const onlineUsers = new Map(); // username -> socket.id
const lastSeen = new Map();    // username -> زمان آخرین بازدید

// رویدادهای Socket.io
io.on("connection", (socket) => {
  let currentUser = null;

  socket.on("login", async (username) => {
    currentUser = username;
    onlineUsers.set(username, socket.id);
    io.emit("user-online", username);

    // ✅ پیام‌های ارسال‌شده به این کاربر که هنوز seen نشده‌اند را seen کن
    try {
      const unseenMessages = await Message.find({
        sender: {$ne: username},
        status: "sent"
      });

      if (unseenMessages.length > 0) {
        await Message.updateMany(
          {sender: {$ne: username}, status: "sent"},
          {$set: {status: "seen"}}
        );

        io.emit("messages-seen", username);
      }
    } catch (err) {
      console.error("Error updating unseen messages:", err);
    }
  });


  app.get("/api/last-seen/:username", (req, res) => {
    const {username} = req.params;
    const isOnline = onlineUsers.has(username);
    if (isOnline) {
      return res.json({status: "online"});
    } else {
      const time = lastSeen.get(username);
      if (time) {
        return res.json({status: `last seen ${time}`});
      } else {
        return res.json({status: `last seen recently`}); // یا هر متن دلخواه
      }
    }
  });


  socket.on("typing", (fromUser) => {
    socket.broadcast.emit("user-typing", fromUser);
  });

  socket.on("send-message", async (msg) => {
    try {
      const saved = await Message.create(msg);
      socket.broadcast.emit("receive-message", saved);
    } catch (err) {
      console.error("Error saving message:", err);
    }
  });

  socket.on("edit-message", async ({messageId, newText}) => {
    try {
      const updated = await Message.findByIdAndUpdate(
        messageId,
        {text: newText, edited: true},
        {new: true}
      );
      if (updated) {
        io.emit("message-edited", updated);
      }
    } catch (err) {
      console.error("Error editing message:", err);
    }
  });

  socket.on("mark-seen", async (fromUsername) => {
    try {
      await Message.updateMany(
        {sender: fromUsername, status: "sent"},
        {$set: {status: "seen"}}
      );
      socket.broadcast.emit("messages-seen", fromUsername);
    } catch (err) {
      console.error("Error marking messages as seen:", err);
    }
  });

  socket.on("delete-message-for-everyone", async (messageId) => {
    try {
      await Message.findByIdAndDelete(messageId);
      io.emit("message-deleted-everyone", messageId);
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  });

  socket.on("disconnect", () => {
    if (currentUser) {
      onlineUsers.delete(currentUser);
      const time = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      lastSeen.set(currentUser, time);
      io.emit("user-offline", {username: currentUser, lastSeen: time});
    }
  });
});

// شروع سرور
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
