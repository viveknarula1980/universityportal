
import sqlite3 from 'sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, '../data/educhain.db');

console.log('Checking database at:', DB_PATH);

const db = new sqlite3.Database(DB_PATH);

db.all("SELECT id, email, role, is_verified, password_hash FROM users", [], (err, rows) => {
  if (err) {
    console.error("❌ Error reading users:", err);
  } else if (rows.length === 0) {
    console.log("⚠️ No users found in database.");
  } else {
    console.log("✅ Users in DB:");
    console.table(rows.map(r => ({...r, password_hash: r.password_hash.substring(0, 10) + '...'})));
  }
  db.close();
});
