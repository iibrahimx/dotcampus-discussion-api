const app = require("./app");

const PORT = process.env.PORT || 4000;

// Start the server process
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
