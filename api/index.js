require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { registerRoutes } = require("./routes/apiRoutes");

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json({ limit: "1mb" }));
registerRoutes(app);

module.exports = app;
