require("dotenv").config();
const app = require("./api/index.js");
const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Deepak Digital Commerce API listening on port ${port}`);
});
