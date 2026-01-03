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
// View Expert_log

app.get("/view-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM expert_log");
    let html = "<h2>Expert Log</h2><table border='1'>";
    html += `
      <tr>
        <th>ID</th><th>Name</th><th>Date</th>
        <th>Men</th><th>Women</th><th>Syringe</th>
        <th>Pipe</th><th>Sandwich</th><th>Soup</th><th>Notes</th>
      </tr>
    `;

    result.rows.forEach(r => {
      html += `
        <tr>
          <td>${r.logid}</td>
          <td>${r.name}</td>
          <td>${r.date}</td>
          <td>${r.totalmen}</td>
          <td>${r.totalwomen}</td>
          <td>${r.totalsyringe}</td>
          <td>${r.totalpipe}</td>
          <td>${r.totalsandwich}</td>
          <td>${r.totalsoup}</td>
          <td>${r.notes}</td>
        </tr>
      `;
    });

    html += "</table>";
    res.send(html);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// View Expert_Camp

app.get("/view-camps", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM expert_camp");
    let html = "<h2>Expert Camps</h2><table border='1'>";
    html += `
      <tr>
        <th>ID</th><th>Name</th><th>Date</th>
        <th>Lat</th><th>Lon</th>
        <th>Men</th><th>Women</th>
        <th>Syringe</th><th>Pipe</th>
        <th>Sandwich</th><th>Soup</th>
        <th>Type</th><th>Notes</th>
        <th>Log ID</th><th>Time</th>
      </tr>
    `;

    result.rows.forEach(r => {
      html += `
        <tr>
          <td>${r.campid}</td>
          <td>${r.name}</td>
          <td>${r.date}</td>
          <td>${r.expertlat}</td>
          <td>${r.expertlon}</td>
          <td>${r.men}</td>
          <td>${r.women}</td>
          <td>${r.syringe}</td>
          <td>${r.pipe}</td>
          <td>${r.sandwich}</td>
          <td>${r.soup}</td>
          <td>${r.type}</td>
          <td>${r.campnotes}</td>
          <td>${r.logid}</td>
          <td>${r.nowtime}</td>
        </tr>
      `;
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
