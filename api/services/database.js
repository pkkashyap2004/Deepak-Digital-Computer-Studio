const mongoose = require("mongoose");
let dbReady = false;

async function db() {
  if (dbReady) return;
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not configured");
  await mongoose.connect(process.env.MONGODB_URI);
  dbReady = true;
}

module.exports = { db };
