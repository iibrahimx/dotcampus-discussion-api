require("dotenv").config();

const app = require("./app");
const env = require("./config/env");

// Start the server process
app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
  console.log(`Enviroment: ${env.nodeEnv}`);
});
