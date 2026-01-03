const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

/* =========================
   PostgreSQL (Render)
   ========================= */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

pool
  .connect()
  .then(() => console.log("Connected to Render PostgreSQL"))
  .catch(err => console.error("Postgres connection error:", err));

/* =========================
   Create table if not exists
   ========================= */

pool.query(`
  CREATE TABLE IF NOT EXISTS expert_log (
    logId SERIAL PRIMARY KEY,
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
`)
.then(() => console.log("expert_log table ready"))
.catch(err => console.error(err));

/* =========================
   Save new log entry
   ========================= */

app.post("/save", async (req, res) => {
  try {
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

    const result = await pool.query(
      `
      INSERT INTO expert_log
      (name, date, totalMen, totalWomen, totalSyringe, totalPipe, totalSandwich, notes, totalSoup)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING logId
      `,
      [
        name,
        date,
        totalMen,
        totalWomen,
        totalSyringe,
        totalPipe,
        totalSandwich,
        notes,
        totalSoup
      ]
    );

    res.json({ success: true, logId: result.rows[0].logid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   Get all log entries
   ========================= */

app.get("/data", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM expert_log ORDER BY logId DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   View database as HTML
   ========================= */

app.get("/view-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM expert_log");
    const rows = result.rows;

    let html = "<h2>Experts Table</h2>";
    html += "<table border='1' cellpadding='5' cellspacing='0'>";
    html += "<tr><th>ID</th><th>Name</th><th>Date</th><th>Total Men</th><th>Total Women</th><th>Total Syringes</th><th>Total Pipes</th><th>Total Sandwiches</th><th>Notes</th><th>Total Soup</th></tr>";

    rows.forEach(row => {
      html += `<tr>
        <td>${row.logid}</td>
        <td>${row.name}</td>
        <td>${row.date}</td>
        <td>${row.totalmen}</td>
        <td>${row.totalwomen}</td>
        <td>${row.totalsyringe}</td>
        <td>${row.totalpipe}</td>
        <td>${row.totalsandwich}</td>
        <td>${row.notes}</td>
        <td>${row.totalsoup}</td>
      </tr>`;
    });

    html += "</table>";
    res.send(html);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/* =========================
   Start server
   ========================= */

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
