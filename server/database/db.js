import sqlite3 from 'sqlite3';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DATABASE_PATH || join(__dirname, '../data/educhain.db');

// Ensure data directory exists
const dataDir = dirname(DB_PATH);
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Create database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✅ Database connected:', DB_PATH);
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Promisify database methods
db.runAsync = promisify(db.run.bind(db));
db.getAsync = promisify(db.get.bind(db));
db.allAsync = promisify(db.all.bind(db));
db.execAsync = promisify(db.exec.bind(db));

// Initialize database schema
export async function initDatabase() {
  try {
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    // Execute schema
    await db.execAsync(schema);
    console.log('✅ Database schema initialized');

    // Create default admin user if doesn't exist
    const adminExists = await db.getAsync('SELECT id FROM users WHERE email = ?', ['admin@university.edu']);
    if (!adminExists) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      const userId = `user-${Date.now()}`;
      
      await db.runAsync(`
        INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        'admin@university.edu',
        passwordHash,
        'Admin User',
        'admin',
        Date.now(),
        Date.now()
      ]);
      console.log('✅ Default admin user created');
    }

    // Create default student user
    const studentExists = await db.getAsync('SELECT id FROM users WHERE email = ?', ['student@university.edu']);
    if (!studentExists) {
      const passwordHash = await bcrypt.hash('student123', 10);
      const userId = `user-${Date.now()}-student`;
      
      await db.runAsync(`
        INSERT INTO users (id, email, password_hash, name, role, student_id, department, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        'student@university.edu',
        passwordHash,
        'Anupam',
        'student',
        'CS2024-0892',
        'Computer Science',
        Date.now(),
        Date.now()
      ]);
      console.log('✅ Default student user created');
    }

    // Create default faculty user
    const facultyExists = await db.getAsync('SELECT id FROM users WHERE email = ?', ['faculty@university.edu']);
    if (!facultyExists) {
      const passwordHash = await bcrypt.hash('faculty123', 10);
      const userId = `user-${Date.now()}-faculty`;
      
      await db.runAsync(`
        INSERT INTO users (id, email, password_hash, name, role, department, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        'faculty@university.edu',
        passwordHash,
        'Dr. Smith',
        'faculty',
        'Computer Science',
        Date.now(),
        Date.now()
      ]);
      console.log('✅ Default faculty user created');
    }

    console.log('✅ Database initialization complete\n');
  } catch (error) {
    // Ignore "already exists" errors
    if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
      console.error('❌ Database initialization error:', error.message);
    }
  }
}

// Helper function for prepared statements
export function prepare(sql) {
  return db.prepare(sql);
}

export default db;
