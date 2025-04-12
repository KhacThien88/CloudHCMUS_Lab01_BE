const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
require('dotenv').config(); 
const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

const secret_name = "secrett_db_mysql_4";

const client = new SecretsManagerClient({
  region: process.env.AWS_REGION || "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

let dbConfig;

async function getSecret() {
  try {
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secret_name,
        VersionStage: "AWSCURRENT",
      })
    );

    const secret = JSON.parse(response.SecretString);
    dbConfig = {
      host: secret.host,
      user: secret.username,
      password: secret.password,
      database: secret.db_name,
      port: secret.port,
    };
  } catch (error) {
    console.error("Error retrieving secret:", error);
    throw error;
  }
}

async function initializeDb() {
  await getSecret();

  const db = mysql.createConnection(dbConfig);

  db.connect((err) => {
    if (err) {
      console.error("Error connecting to MySQL:", err);
      throw err;
    }
    console.log("MySQL connected");
  });

  return db;
}

app.post("/tasks", async (req, res) => {
  const db = await initializeDb();
  const { title, description } = req.body;
  const query = "INSERT INTO tasks (title, description) VALUES (?, ?)";
  db.query(query, [title, description], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Failed to create task" });
    }
    res.status(201).json({ message: "Task created", taskId: result.insertId });
  });
});

app.get("/tasks", async (req, res) => {
  const db = await initializeDb();
  console.log("Fetching tasks...");
  const query = "SELECT * FROM tasks";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      throw err;
    }
    console.log("Tasks fetched:", results);
    res.status(200).json(results);
  });
});

app.put("/tasks/:id", async (req, res) => {
  const db = await initializeDb();
  const { id } = req.params;
  const { title, description, completed } = req.body;
  const query = "UPDATE tasks SET title = ?, description = ?, completed = ? WHERE id = ?";
  db.query(query, [title, description, completed, id], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Failed to update task" });
    }
    res.status(200).json({ message: "Task updated" });
  });
});

app.delete("/tasks/:id", async (req, res) => {
  const db = await initializeDb();
  const { id } = req.params;
  const query = "DELETE FROM tasks WHERE id = ?";
  db.query(query, [id], (err, result) => {
    if (err) throw err;
    res.status(200).send("Task deleted");
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});