const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

const pool = new Pool({
  user: "postgres",
  host: "db",
  database: "appdb",
  password: "devpass",
  port: 5432,
});

const { publish } = require("./event");

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/users", async (req, res) => {
  const { name } = req.body;

  const result = await pool.query(
    "INSERT INTO users(name) VALUES($1) RETURNING *",
    [name]
  );

  const user = result.rows[0];

  await publish("user_created", user);

  res.json(user);
});

app.get("/users", async (req, res) => {
  const result = await pool.query("SELECT * FROM users");
  res.json(result.rows);
});

app.listen(3000, () => console.log("API running"));
