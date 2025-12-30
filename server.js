const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Render automatically provides the port
const PORT = process.env.PORT || 3000;

// Test route
app.get("/", (req, res) => {
  res.send("DataExpert backend is running...");
});

// call routes

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
