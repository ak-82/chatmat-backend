const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");

mongoose.connect("mongodb://localhost:27017/chatdb").then(async () => {
  await User.deleteMany({});

  const users = [
    { username: "user1", password: await bcrypt.hash("83123821", 10), showName : "Wade💖" },
    { username: "user2", password: await bcrypt.hash("86000", 10), showName : "❤️‍🔥Ember❤️‍🔥" },
  ];

  await User.insertMany(users);
  console.log("Users created");
  mongoose.disconnect();
});
