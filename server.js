const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Database stored in server root (ephemeral)
const DB_PATH = path.join(__dirname, "expert_log_database.db");

// Connect to SQLite
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) console.error(err.message);
  else console.log("Connected to SQLite database at " + DB_PATH);
});

// Create expert_log table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS expert_log (
    logId INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    totalMen INTEGER NOT NULL,
    totalWomen INTEGER NOT NULL,
    totalSyringe INTEGER NOT NULL,
    totalPipe INTEGER NOT NULL,
    totalSandwich INTEGER NOT NULL,
    notes TEXT NOT NULL,
    totalSoup INTEGER NOT NULL
  )
`);

// Save new log entry
app.post("/save", (req, res) => {
  const {
    name,
    date,
    totalMen,
    totalWomen,
    totalSyringe,
    totalPipe,
    totalSandwich,
    notes,
    totalSoup
  } = req.body;

  const sql = `
    INSERT INTO expert_log
    (name, date, totalMen, totalWomen, totalSyringe, totalPipe, totalSandwich, notes, totalSoup)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    sql,
    [name, date, totalMen, totalWomen, totalSyringe, totalPipe, totalSandwich, notes, totalSoup],
    function (err) {
      if (err) return res.status(500).json(err);
      res.json({ success: true, logId: this.lastID });
    }
  );
});

// Get all log entries
app.get("/data", (req, res) => {
  db.all("SELECT * FROM expert_log", [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

