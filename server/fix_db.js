import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: 'postgresql://testai_tzc8_user:pbNX5MhvcD03GmKeFo7gc76OzsvKCWNp@dpg-d717lh7gi27c73f8jl30-a.oregon-postgres.render.com/testai_tzc8',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log("Fixing constraints...");
    
    // In PostgreSQL, to drop a constraint we might need to know its exact name. 
    // Usually it's table_column_check. Let's just try inserting. Wait, we can just temporarily
    // update the exact constraint. It's easier to just try inserting the superadmin user directly.
    // If it fails with a constraint violation, we'll see the exact constraint name in the error!
    
    // But let's first check if user exists.
    const exists = await pool.query("SELECT * FROM users WHERE email = 'superadmin@university.edu'");
    if (exists.rows.length === 0) {
      console.log("Superadmin not found. Attempting to drop constraint and insert...");
      
      // Get the name of the check constraint for the role column
      const constraintQuery = await pool.query(`
        SELECT constraint_name 
        FROM information_schema.constraint_column_usage 
        WHERE table_name = 'users' AND column_name = 'role';
      `);
      
      for (let row of constraintQuery.rows) {
        if (row.constraint_name.includes('check')) {
          console.log("Dropping constraint: " + row.constraint_name);
          await pool.query(`ALTER TABLE users DROP CONSTRAINT "${row.constraint_name}"`);
        }
      }
      
      // Add the new constraint
      console.log("Adding new constraint...");
      await pool.query("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK(role IN ('student', 'faculty', 'admin', 'super_admin'))");
      
      const passwordHash = await bcrypt.hash('superadmin123', 10);
      const userId = `user-${Date.now()}-super_admin`;
      const now = Date.now();
      
      await pool.query(`
        INSERT INTO users (id, email, password_hash, name, role, student_id, department, is_verified, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        userId,
        'superadmin@university.edu',
        passwordHash,
        'System Super Admin',
        'super_admin',
        null,
        null,
        true,
        now,
        now
      ]);
      
      console.log("Successfully inserted superadmin!");
    } else {
      console.log("Superadmin already exists!");
    }
    
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
