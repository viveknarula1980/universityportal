import sqlite3 from 'sqlite3';
import pkg from 'pg';
const { Pool } = pkg;
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const IS_POSTGRES = !!process.env.DATABASE_URL;
const DB_PATH = process.env.DATABASE_PATH || join(__dirname, '../data/educhain.db');

let db;
let pool;

if (IS_POSTGRES) {
  console.log('✅ Database: Using PostgreSQL (v2)');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for many cloud Postgres providers like Neon/Supabase
    }
  });
  
  // Create a compatibility layer for sqlite-style methods
  const replacePlaceholders = (sql) => {
    let count = 0;
    return sql.replace(/\?/g, () => `$${++count}`);
  };

  db = {
    run: async (sql, params = []) => {
      const result = await pool.query(replacePlaceholders(sql), params);
      return result;
    },
    get: async (sql, params = []) => {
      const result = await pool.query(replacePlaceholders(sql), params);
      return result.rows[0];
    },
    all: async (sql, params = []) => {
      const result = await pool.query(replacePlaceholders(sql), params);
      return result.rows;
    },
    exec: async (sql) => {
      return await pool.query(sql);
    },
    prepare: (sql) => {
      return {
        run: async (params) => {
          return await pool.query(replacePlaceholders(sql), params);
        },
        finalize: () => {}
      };
    }
  };
} else {
  console.log('✅ Database: Using SQLite');
  // Ensure data directory exists
  const dataDir = dirname(DB_PATH);
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  const sqliteDb = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('❌ Database connection error:', err);
    } else {
      console.log('✅ Database connected:', DB_PATH);
    }
  });

  sqliteDb.run('PRAGMA foreign_keys = ON');

  // Promisify database methods for compatibility
  db = {
    run: promisify(sqliteDb.run.bind(sqliteDb)),
    get: promisify(sqliteDb.get.bind(sqliteDb)),
    all: promisify(sqliteDb.all.bind(sqliteDb)),
    exec: promisify(sqliteDb.exec.bind(sqliteDb)),
    prepare: sqliteDb.prepare.bind(sqliteDb)
  };
}

// Global async methods
db.runAsync = db.run;
db.getAsync = db.get;
db.allAsync = db.all;
db.execAsync = db.exec;

// Initialize database schema
export async function initDatabase() {
  try {
    const schemaPath = join(__dirname, 'schema.sql');
    let schema = readFileSync(schemaPath, 'utf-8');
    
    // Adapt schema for Postgres if necessary
    if (IS_POSTGRES) {
      // Basic adaptations
      schema = schema.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'SERIAL PRIMARY KEY');
      schema = schema.replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/g, 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      schema = schema.replace(/BOOLEAN DEFAULT 0/g, 'BOOLEAN DEFAULT FALSE');
      schema = schema.replace(/BOOLEAN DEFAULT 1/g, 'BOOLEAN DEFAULT TRUE');
      // Postgres doesn't need PRAGMA
      schema = schema.split('\n').filter(line => !line.includes('PRAGMA')).join('\n');
    }

    // Execute schema (creates tables if they don't exist)
    // For Postgres, we might need to split by semicolon to execute one by one if it's large,
    // but pool.query usually handles multi-statement if configured or if using a single string.
    await db.execAsync(schema);
    console.log('✅ Database schema initialized');

    // MIGRATION check (different for Postgres)
    if (!IS_POSTGRES) {
      try {
        const tableInfo = await db.allAsync("PRAGMA table_info(users)");
        const hasGoogleId = tableInfo.some(col => col.name === 'google_id');
        const hasIsVerified = tableInfo.some(col => col.name === 'is_verified');

        if (!hasGoogleId) {
          console.log('🔄 Adding google_id column to users table...');
          await db.runAsync("ALTER TABLE users ADD COLUMN google_id TEXT");
        }
        
        if (!hasIsVerified) {
          console.log('🔄 Adding is_verified column to users table...');
          await db.runAsync("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 0");
          await db.runAsync("UPDATE users SET is_verified = 1");
        }
      } catch (migrationError) {
        console.warn('⚠️ Migration check failed:', migrationError.message);
      }
    } else {
        // Postgres migration logic could go here, but usually handled by schema.sql with IF NOT EXISTS
    }

    // Create default users if they don't exist
    const defaultUsers = [
      {
        email: 'admin@university.edu',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin',
        student_id: null,
        department: null
      },
      {
        email: 'beraa634@gmail.com',
        password: 'beraa634',
        name: 'Anupam Admin',
        role: 'admin',
        student_id: null,
        department: null
      },
      {
        email: 'student@university.edu',
        password: 'student123',
        name: 'Anupam',
        role: 'student',
        student_id: 'CS2024-0892',
        department: 'Computer Science'
      },
      {
        email: 'faculty@university.edu',
        password: 'faculty123',
        name: 'Dr. Smith',
        role: 'faculty',
        student_id: null,
        department: 'Computer Science'
      }
    ];

    for (const user of defaultUsers) {
      const exists = await db.getAsync('SELECT id FROM users WHERE email = ?', [user.email]);
      if (!exists) {
        const passwordHash = await bcrypt.hash(user.password, 10);
        const userId = `user-${Date.now()}-${user.role}`;
        const now = Date.now();
        
        await db.runAsync(`
          INSERT INTO users (id, email, password_hash, name, role, student_id, department, is_verified, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          userId,
          user.email,
          passwordHash,
          user.name,
          user.role,
          user.student_id,
          user.department,
          IS_POSTGRES ? true : 1,
          now,
          now
        ]);
        console.log(`✅ Default ${user.role} user created: ${user.email}`);
      }
    }

    console.log('✅ Database initialization complete\n');
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
  }
}

// Helper function for prepared statements
export function prepare(sql) {
  return db.prepare(sql);
}

export default db;
