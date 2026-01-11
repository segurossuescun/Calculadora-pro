require("dotenv").config();
console.log("✅ API starting...");

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors({
  origin: true,
  credentials: false
}));
app.use(express.json());

// 🔌 Neon pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
app.get("/", (req, res) => {
  res.send("✅ Calculadora Pro API running. Usa /health");
});

// ✅ Health check
app.get("/health", async (req, res) => {
  try {
    const r = await pool.query("SELECT now()");
    res.json({
      status: "ok",
      db_time: r.rows[0].now
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message
    });
  }
});

// 🚀 Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔥 Calculadora Pro backend corriendo en http://localhost:${PORT}`);
});
