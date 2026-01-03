const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

/* =========================
   PostgreSQL Connection
   ========================= */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Single database URL
  ssl: { rejectUnauthorized: false } // required for Render/Neon
});

pool.connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch(err => console.error("Postgres connection error:", err));

/* =========================
   Create tables if not exists
   ========================= */

const createExpertLogSQL = `
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
);
`;

const createExpertCampSQL = `
CREATE TABLE IF NOT EXISTS expert_camp (
  campId SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  expertLat REAL NOT NULL,
  expertLon REAL NOT NULL,
  men INTEGER NOT NULL,
  women INTEGER NOT NULL,
  syringe INTEGER NOT NULL,
  pipe INTEGER NOT NULL,
  sandwich INTEGER NOT NULL,
  type TEXT NOT NULL,
  campNotes TEXT NOT NULL,
  logId INTEGER NOT NULL REFERENCES expert_log(logId) ON DELETE CASCADE,
  nowTime TEXT NOT NULL,
  soup INTEGER NOT NULL
);
`;

async function initTables() {
  await pool.query(createExpertLogSQL);
  await pool.query(createExpertCampSQL);
  console.log("Tables ready in the database");
}

initTables();

/* =========================
   Save new log entry
   ========================= */
app.post("/save", async (req, res) => {
  try {
    const {
      name, date, totalMen, totalWomen,
      totalSyringe, totalPipe, totalSandwich,
      notes, totalSoup
    } = req.body;

    const values = [name, date, totalMen, totalWomen, totalSyringe, totalPipe, totalSandwich, notes, totalSoup];

    const result = await pool.query(
      `INSERT INTO expert_log
       (name, date, totalMen, totalWomen, totalSyringe, totalPipe, totalSandwich, notes, totalSoup)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING logId`,
      values
    );

    res.json({ success: true, logId: result.rows[0].logid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   Save new camp entry
   ========================= */
app.post("/save-camp", async (req, res) => {
  try {
    const {
      name, date, expertLat, expertLon,
      men, women, syringe, pipe, sandwich,
      type, campNotes, logId, nowTime, soup
    } = req.body;

    const values = [name, date, expertLat, expertLon, men, women, syringe, pipe, sandwich, type, campNotes, logId, nowTime, soup];

    await pool.query(
      `INSERT INTO expert_camp
      (name,date,expertLat,expertLon,men,women,syringe,pipe,sandwich,type,campNotes,logId,nowTime,soup)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      values
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
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
   Get all camp entries
   ========================= */
app.get("/camps", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM expert_camp ORDER BY campId DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   View expert_log as HTML
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
   View expert_camp as HTML
   ========================= */
app.get("/view-camps", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM expert_camp ORDER BY campId DESC");
    const rows = result.rows;

    let html = "<h2>Expert Camps Table</h2>";
    html += "<table border='1' cellpadding='5' cellspacing='0'>";
    html += "<tr><th>ID</th><th>Name</th><th>Date</th><th>Lat</th><th>Lon</th><th>Men</th><th>Women</th><th>Syringe</th><th>Pipe</th><th>Sandwich</th><th>Type</th><th>Notes</th><th>Log ID</th><th>Time</th><th>Soup</th></tr>";

    rows.forEach(row => {
      html += `<tr>
        <td>${row.campid}</td>
        <td>${row.name}</td>
        <td>${row.date}</td>
        <td>${row.expertlat}</td>
        <td>${row.expertlon}</td>
        <td>${row.men}</td>
        <td>${row.women}</td>
        <td>${row.syringe}</td>
        <td>${row.pipe}</td>
        <td>${row.sandwich}</td>
        <td>${row.type}</td>
        <td>${row.campnotes}</td>
        <td>${row.logid}</td>
        <td>${row.nowtime}</td>
        <td>${row.soup}</td>
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
