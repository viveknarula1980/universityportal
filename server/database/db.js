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
      // Convert INTEGER to BIGINT to prevent overflow with ms timestamps
      schema = schema.replace(/\bINTEGER\b/g, 'BIGINT');
      schema = schema.replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/g, 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      schema = schema.replace(/BOOLEAN DEFAULT 0/g, 'BOOLEAN DEFAULT FALSE');
      schema = schema.replace(/BOOLEAN DEFAULT 1/g, 'BOOLEAN DEFAULT TRUE');
      // Postgres doesn't need PRAGMA
      schema = schema.split('\n').filter(line => !line.includes('PRAGMA')).join('\n');
    }

    // Execute schema (creates tables if they don't exist)
    if (IS_POSTGRES) {
      // Split schema into individual statements for better reliability in Postgres
      const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      for (const statement of statements) {
        await db.execAsync(statement);
      }
    } else {
      await db.execAsync(schema);
    }
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
        // Postgres migration: Ensure all INTEGER columns are BIGINT to prevent overflow
        try {
          console.log('🔄 Checking for INTEGER to BIGINT migrations (PostgreSQL)...');
          const tables = ['users', 'otp_codes', 'assignments', 'submissions', 'certificates', 'ai_usage', 'ai_limits', 'audit_logs', 'blockchain_records'];
          for (const table of tables) {
            // Get columns for the table
            const colsResult = await pool.query(`
              SELECT column_name, data_type 
              FROM information_schema.columns 
              WHERE table_name = $1 AND data_type = 'integer'
            `, [table]);
            
            for (const col of colsResult.rows) {
              console.log(`⬆️ Upgrading column ${table}.${col.column_name} to BIGINT...`);
              await db.execAsync(`ALTER TABLE ${table} ALTER COLUMN ${col.column_name} TYPE BIGINT`);
            }
          }
        } catch (migrationError) {
          console.warn('⚠️ Postgres migration check failed:', migrationError.message);
        }

        // Fix NULL revocation_status in certificates (should always be 0 or 1)
        try {
          const fixResult = await pool.query('UPDATE certificates SET revocation_status = 0 WHERE revocation_status IS NULL');
          if (fixResult.rowCount > 0) {
            console.log(`🔧 Fixed ${fixResult.rowCount} certificates with NULL revocation_status`);
          }
        } catch (fixErr) {
          console.warn('⚠️ Could not fix NULL revocation_status:', fixErr.message);
        }
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
        console.log(`🏗️ Creating missing default user: ${user.email}`);
        
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
