import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import sqlite3 from "sqlite3";

const app = express();
const db = new sqlite3.Database(":memory:");

// Setup: Same database setup as index_fail_open.ts
db.serialize(() => {
  db.run(`CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT,
    is_admin INTEGER
  )`);

  db.run("INSERT INTO users (username, is_admin) VALUES ('alice', 0)");
  db.run("INSERT INTO users (username, is_admin) VALUES ('bob', 1)");
});

// SECURE MIDDLEWARE: Fail-Closed Authorization
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.query.id;

  // FIX 1: Use parameterized queries to prevent SQL injection attempts to trigger errors
  const query = "SELECT is_admin FROM users WHERE id = ?";

  db.get(query, [userId], (err: Error | null, row: any) => {
    if (err) {
      // FIX 2: Log internally but FAIL-CLOSED by returning an error response to the user.
      // Do NOT call next().
      console.error("[AUTH_ERROR] Internal error during check:", err.message);
      res.status(500).json({ error: "An internal security error occurred." });
      return;
    }

    // FIX 3: Be explicit. Only grant access if the condition is clearly met.
    if (row && row.is_admin === 1) {
      next();
    } else {
      // Default: Access Denied
      res.status(403).json({ error: "Access Denied: Admins only." });
    }
  });
};

app.get("/admin/dashboard", isAdmin, (req: Request, res: Response) => {
  res.json({
    message: "Welcome to the Secret Admin Dashboard!",
    sensitive_data: "The nuclear codes are: 12345",
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Fail-Closed (FIXED) Demo running on http://localhost:${PORT}`);
});
