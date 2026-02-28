import express, { type Request, type Response } from "express";
import sqlite3 from "sqlite3";

const app = express();
const db = new sqlite3.Database(":memory:");

interface UserRow {
  username: string;
}

// Setup: Create a sensitive users table and seed it
db.serialize(() => {
  db.run(`CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT,
    password_hash TEXT,
    salt TEXT,
    secret_question TEXT
  )`);

  db.run(`INSERT INTO users (username, password_hash, salt, secret_question) 
          VALUES ('admin', 'd623b7b2...', 'x9a2', 'Mother''s maiden name')`);
});

// VULNERABLE ENDPOINT: Search users by username
app.get("/users/search", (req: Request, res: Response) => {
  const username = req.query.username as string;

  // VULNERABILITY 1: Direct string concatenation (SQL Injection)
  // VULNERABILITY 2: No try-catch or generic error handling, revealing the full DB error
  const query =
    "SELECT username FROM users WHERE username = '" + username + "'";

  db.all(query, (err: Error | null, rows: UserRow[]) => {
    if (err) {
      // LEAK: Sending the raw database error message to the client
      console.error(err);
      res.status(500).json({
        error: "Database Error: " + err.message,
        query: query, // This makes it even worse, but often happens in "debug" mode
      });
      return;
    }
    res.json(rows);
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Demo app running on http://localhost:${PORT}`);
  console.log(
    `Vulnerable endpoint: http://localhost:${PORT}/users/search?username=admin`,
  );
});
