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
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch(err => console.error("Postgres connection error:", err));

/* =========================
   Create tables (LOWERCASE)
   ========================= */

const createExpertLogSQL = `
CREATE TABLE IF NOT EXISTS expert_log (
  logid UUID PRIMARY KEY,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  totalmen INTEGER NOT NULL,
  totalwomen INTEGER NOT NULL,
  totalsyringe INTEGER NOT NULL,
  totalpipe INTEGER NOT NULL,
  totalsandwich INTEGER NOT NULL,
  notes TEXT NOT NULL,
  totalsoup INTEGER NOT NULL
);
`;

const createExpertCampSQL = `
CREATE TABLE IF NOT EXISTS expert_camp (
  campid UUID PRIMARY KEY,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  expertlat REAL NOT NULL,
  expertlon REAL NOT NULL,
  men INTEGER NOT NULL,
  women INTEGER NOT NULL,
  syringe INTEGER NOT NULL,
  pipe INTEGER NOT NULL,
  sandwich INTEGER NOT NULL,
  type TEXT NOT NULL,
  campnotes TEXT NOT NULL,
  logid UUID NOT NULL REFERENCES expert_log(logid) ON DELETE CASCADE,
  nowtime TEXT NOT NULL,
  soup INTEGER NOT NULL
);
`;

async function initTables() {
  await pool.query(createExpertLogSQL);
  await pool.query(createExpertCampSQL);
  console.log("Tables ready");
}

initTables();

/* =========================
   Routes
   ========================= */

// Save Expert Log
app.post("/save", async (req, res) => {
  try {
    const {
      logid,
      name,
      date,
      totalmen,
      totalwomen,
      totalsyringe,
      totalpipe,
      totalsandwich,
      notes,
      totalsoup
    } = req.body;

    await pool.query(
      `
      INSERT INTO expert_log
      (logid,name,date,totalmen,totalwomen,totalsyringe,totalpipe,totalsandwich,notes,totalsoup)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      `,
      [logid, name, date, totalmen, totalwomen, totalsyringe, totalpipe, totalsandwich, notes, totalsoup]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Save Expert Camp
app.post("/save-camp", async (req, res) => {
  try {
    const {
      campid,
      name,
      date,
      expertlat,
      expertlon,
      men,
      women,
      syringe,
      pipe,
      sandwich,
      type,
      campnotes,
      logid,
      nowtime,
      soup
    } = req.body;

    await pool.query(
      `
      INSERT INTO expert_camp
      (campid,name,date,expertlat,expertlon,men,women,syringe,pipe,sandwich,type,campnotes,logid,nowtime,soup)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      `,
      [campid, name, date, expertlat, expertlon, men, women, syringe, pipe, sandwich, type, campnotes, logid, nowtime, soup]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Fetch logs
app.get("/data", async (req, res) => {
  const result = await pool.query("SELECT * FROM expert_log ORDER BY date DESC");
  res.json(result.rows);
});

// Fetch camps
app.get("/camps", async (req, res) => {
  const result = await pool.query("SELECT * FROM expert_camp ORDER BY date DESC");
  res.json(result.rows);
});

/* =========================
   View database as HTML
   ========================= */

//View Expert Log

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

// View Expert Camps

app.get("/view-camps", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM expert_camp");
    const rows = result.rows;

    let html = "<h2>Expert Camps</h2>";
    html += "<table border='1' cellpadding='5' cellspacing='0'>";
    html += `<tr>
      <th>ID</th><th>Name</th><th>Date</th>
      <th>Lat</th><th>Lon</th>
      <th>Men</th><th>Women</th>
      <th>Syringe</th><th>Pipe</th>
      <th>Sandwich</th><th>Soup</th>
      <th>Type</th><th>Notes</th>
      <th>Log ID</th><th>Time</th>
    </tr>`;

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
        <td>${row.soup}</td>
        <td>${row.type}</td>
        <td>${row.campnotes}</td>
        <td>${row.logid}</td>
        <td>${row.nowtime}</td>
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

