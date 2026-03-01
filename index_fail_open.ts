import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import sqlite3 from "sqlite3";

const app = express();
const db = new sqlite3.Database(":memory:");

// Setup: Create users with roles
db.serialize(() => {
  db.run(`CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT,
    is_admin INTEGER
  )`);

  db.run("INSERT INTO users (username, is_admin) VALUES ('alice', 0)");
  db.run("INSERT INTO users (username, is_admin) VALUES ('bob', 1)");
});

// VULNERABLE MIDDLEWARE: Fail-Open Authorization
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.query.id;

  // Vulnerability: If the query fails (e.g. due to SQL injection or DB error),
  // the error block doesn't stop the request, it just logs and calls next().
  const query = `SELECT is_admin FROM users WHERE id = ${userId}`;

  db.get(query, (err: Error | null, row: any) => {
    if (err) {
      console.error("[AUTH_ERROR] Database error during check:", err.message);
      // FAIL-OPEN: The developer forgot to return an error response here!
      // By calling next(), the request continues as if authorized.
      console.log(
        "!!! FAIL-OPEN: Error occurred, but allowing request to proceed !!!",
      );
      next();
      return;
    }

    if (row && row.is_admin === 1) {
      next();
    } else {
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
  console.log(`Fail-Open Demo running on http://localhost:${PORT}`);
  console.log(
    `Normal access (Alice - Denied): http://localhost:3001/admin/dashboard?id=1`,
  );
  console.log(
    `Exploit (Trigger Error): http://localhost:3001/admin/dashboard?id=1%20OR%20(SELECT%201%20FROM%20non_existent_table)`,
  );
});
