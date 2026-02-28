import express, { type Request, type Response } from "express";
import sqlite3 from "sqlite3";

const app = express();
const db = new sqlite3.Database(":memory:");

interface UserRow {
  username: string;
}

// Setup: Same database setup as index.ts
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

// FIXED ENDPOINT: Search users by username
app.get("/users/search", (req: Request, res: Response) => {
  const username = req.query.username as string;

  // FIX 1: Use parameterized queries (Prepared Statements) to prevent SQL Injection
  const query = "SELECT username FROM users WHERE username = ?";

  db.all(query, [username], (err: Error | null, rows: UserRow[]) => {
    if (err) {
      // FIX 2: Log the error internally
      console.error("[INTERNAL_ERROR] DB Query failed:", err.message);

      // FIX 3: Return a generic error message to the user
      res.status(500).json({
        error: "An internal server error occurred. Please try again later.",
      });
      return;
    }
    res.json(rows);
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`SECURE app running on http://localhost:${PORT}`);
  console.log(
    `Secure endpoint: http://localhost:${PORT}/users/search?username=admin`,
  );
});
