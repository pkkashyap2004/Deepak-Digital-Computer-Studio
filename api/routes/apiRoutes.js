const { registerApiController } = require("../controllers/apiController");

function registerRoutes(app) {
  registerApiController(app);
}

module.exports = { registerRoutes };
