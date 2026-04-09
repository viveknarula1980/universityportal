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
        const hasUniversityId = tableInfo.some(col => col.name === 'university_id');

        if (!hasGoogleId) {
          console.log('🔄 Adding google_id column to users table...');
          await db.runAsync("ALTER TABLE users ADD COLUMN google_id TEXT");
        }
        
        if (!hasIsVerified) {
          console.log('🔄 Adding is_verified column to users table...');
          await db.runAsync("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 0");
          await db.runAsync("UPDATE users SET is_verified = 1");
        }

        if (!hasUniversityId) {
          console.log('🔄 Adding university_id column to users table...');
          await db.runAsync("ALTER TABLE users ADD COLUMN university_id TEXT");
          await db.runAsync("UPDATE users SET university_id = 'default'");
        }

        const settingsInfo = await db.allAsync("PRAGMA table_info(university_settings)");
        const hasSlug = settingsInfo.some(col => col.name === 'slug');
        if (!hasSlug) {
          console.log('🔄 Adding slug column to university_settings table...');
          await db.runAsync("ALTER TABLE university_settings ADD COLUMN slug TEXT UNIQUE");
          await db.runAsync("UPDATE university_settings SET slug = 'default' WHERE id = 'default'");
        }

        const assignmentsTableInfo = await db.allAsync("PRAGMA table_info(assignments)");
        const hasStream = assignmentsTableInfo.some(col => col.name === 'stream');

        if (!hasStream) {
          console.log('🔄 Adding stream column to assignments table...');
          await db.runAsync("ALTER TABLE assignments ADD COLUMN stream TEXT");
        }

        const hasAssignmentUnivId = assignmentsTableInfo.some(col => col.name === 'university_id');
        if (!hasAssignmentUnivId) {
          console.log('🔄 Adding university_id column to assignments table...');
          await db.runAsync("ALTER TABLE assignments ADD COLUMN university_id TEXT");
          await db.runAsync("UPDATE assignments SET university_id = 'default'");
        }

        const certsTableInfo = await db.allAsync("PRAGMA table_info(certificates)");
        const hasCertUnivId = certsTableInfo.some(col => col.name === 'university_id');
        if (!hasCertUnivId) {
           console.log('🔄 Adding university_id column to certificates table...');
           await db.runAsync("ALTER TABLE certificates ADD COLUMN university_id TEXT");
           await db.runAsync("UPDATE certificates SET university_id = 'default'");
        }

        const subsTableInfo = await db.allAsync("PRAGMA table_info(submissions)");
        const hasSubUnivId = subsTableInfo.some(col => col.name === 'university_id');
        if (!hasSubUnivId) {
           console.log('🔄 Adding university_id column to submissions table...');
           await db.runAsync("ALTER TABLE submissions ADD COLUMN university_id TEXT");
           await db.runAsync("UPDATE submissions SET university_id = 'default'");
        }
      } catch (migrationError) {
        console.warn('⚠️ Migration check failed:', migrationError.message);
      }
    } else {
        // Postgres migration
        try {
          console.log('🔄 Checking for PostgreSQL migrations (slug, university_id)...');
          
          // Check users for university_id
          const usersCols = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'users'
          `);
          const userColNames = usersCols.rows.map(r => r.column_name);

          if (!userColNames.includes('university_id')) {
            await db.execAsync("ALTER TABLE users ADD COLUMN university_id TEXT");
            await db.execAsync("UPDATE users SET university_id = 'default'");
          }
          if (!userColNames.includes('google_id')) {
            await db.execAsync("ALTER TABLE users ADD COLUMN google_id TEXT");
          }
          if (!userColNames.includes('is_verified')) {
            await db.execAsync("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT TRUE");
            await db.execAsync("UPDATE users SET is_verified = TRUE");
          }

          // Check university_settings for slug
          const settingsCols = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'university_settings'
          `);
          const settingsColNames = settingsCols.rows.map(r => r.column_name);
          if (!settingsColNames.includes('slug')) {
             await db.execAsync("ALTER TABLE university_settings ADD COLUMN slug TEXT UNIQUE");
             await db.execAsync("UPDATE university_settings SET slug = 'default' WHERE id = 'default'");
          }

          // Check assignments, certificates, submissions, projects, public_profiles for university_id and stream
          for (const table of ['assignments', 'certificates', 'submissions', 'projects', 'public_profiles']) {
             try {
                const tableCols = await pool.query(`
                  SELECT column_name FROM information_schema.columns 
                  WHERE table_name = '${table}'
                `);
                
                if (tableCols.rowCount === 0) {
                   // Table might not exist yet if schema execution failed or was skipped
                   continue;
                }

                const colNames = tableCols.rows.map(r => r.column_name);

                if (!colNames.includes('university_id') && table !== 'public_profiles' && table !== 'project_members') {
                    console.log(`🔄 Adding university_id to ${table} table (Postgres)...`);
                    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN university_id TEXT`);
                    await db.execAsync(`UPDATE ${table} SET university_id = 'default'`);
                }

                if (table === 'assignments' && !colNames.includes('stream')) {
                    console.log('🔄 Adding stream to assignments table (Postgres)...');
                    await db.execAsync("ALTER TABLE assignments ADD COLUMN stream TEXT");
                }
             } catch (innerError) {
                console.warn(`⚠️ Migration check failed for table ${table}:`, innerError.message);
             }
          }
          // Final Postgres column check for types (overflow prevention)
          console.log('🔄 Checking for PostgreSQL column type migrations...');
          const timestampCols = [
            { table: 'assignments', columns: ['due_date', 'created_at'] },
            { table: 'submissions', columns: ['timestamp'] },
            { table: 'certificates', columns: ['issue_date', 'created_at'] },
            { table: 'audit_logs', columns: ['timestamp'] },
            { table: 'blockchain_records', columns: ['timestamp', 'created_at'] },
            { table: 'ai_usage', columns: ['created_at'] },
            { table: 'ai_limits', columns: ['created_at', 'updated_at'] },
            { table: 'departments', columns: ['created_at'] },
            { table: 'projects', columns: ['created_at'] },
            { table: 'project_members', columns: ['joined_at'] },
            { table: 'public_profiles', columns: ['updated_at'] }
          ];

          for (const item of timestampCols) {
            for (const col of item.columns) {
              try {
                const colInfo = await pool.query(`
                  SELECT data_type FROM information_schema.columns 
                  WHERE table_name = '${item.table}' AND column_name = '${col}'
                `);
                if (colInfo.rowCount > 0 && colInfo.rows[0].data_type === 'integer') {
                  console.log(`🔄 Converting ${item.table}.${col} to BIGINT (Postgres)...`);
                  await db.execAsync(`ALTER TABLE ${item.table} ALTER COLUMN ${col} TYPE BIGINT`);
                }
              } catch (e) {
                console.warn(`⚠️ Could not convert ${item.table}.${col}:`, e.message);
              }
            }
          }
        } catch (migrationError) {
          console.warn('⚠️ Postgres migration check failed:', migrationError.message);
        }
    }

    // Create default users if they don't exist
    const defaultUsers = [
      {
        email: 'superadmin@university.edu',
        password: 'superadmin123',
        name: 'System Super Admin',
        role: 'super_admin',
        student_id: null,
        department: null
      },
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
          INSERT INTO users (id, email, password_hash, name, role, student_id, department, is_verified, university_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          userId,
          user.email,
          passwordHash,
          user.name,
          user.role,
          user.student_id,
          user.department,
          IS_POSTGRES ? true : 1,
          'default',
          now,
          now
        ]);
        console.log(`✅ Default ${user.role} user created: ${user.email}`);
      }
    }
    
    // Seed default branding settings
    const settingsExists = await db.getAsync("SELECT id FROM university_settings WHERE id = 'default'");
    if (!settingsExists) {
        await db.runAsync("INSERT INTO university_settings (id, slug, university_name, primary_color, logo_url, updated_at) VALUES (?, ?, ?, ?, ?, ?)", 
        ['default', 'default', 'EduChain University', '#06b6d4', 'https://example.com/logo.png', Date.now()]);
        console.log('✅ Default branding settings initialized');
    }

    // Seed default departments
    const deptCount = await db.getAsync("SELECT COUNT(*) as count FROM departments WHERE university_id = 'default'");
    if (deptCount && deptCount.count === 0) {
        const defaultDepts = ['Computer Science', 'Agriculture', 'Medical'];
        for (const name of defaultDepts) {
            const deptId = `dept-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            await db.runAsync(
                'INSERT INTO departments (id, name, university_id, created_at) VALUES (?, ?, ?, ?)',
                [deptId, name, 'default', Date.now()]
            );
        }
        console.log('✅ Default departments seeded');
    }

  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
  }
}

// Helper function for prepared statements
export function prepare(sql) {
  return db.prepare(sql);
}

export default db;
