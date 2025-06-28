const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");

mongoose.connect("mongodb://localhost:27017/chatdb").then(async () => {
  await User.deleteMany({});

  const users = [
    { username: "user1", password: await bcrypt.hash("pass1", 10), showName : "Wade💖" },
    { username: "user2", password: await bcrypt.hash("pass2", 10), showName : "❤️‍🔥Ember❤️‍🔥" },
  ];

  await User.insertMany(users);
  console.log("Users created");
  mongoose.disconnect();
});
