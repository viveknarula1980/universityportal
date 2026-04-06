import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://testai_tzc8_user:pbNX5MhvcD03GmKeFo7gc76OzsvKCWNp@dpg-d717lh7gi27c73f8jl30-a.oregon-postgres.render.com/testai_tzc8',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS university_settings (
          id TEXT PRIMARY KEY,
          university_name TEXT,
          primary_color TEXT,
          logo_url TEXT,
          updated_at BIGINT NOT NULL
      )
    `);
    
    // Seed it
    const res = await pool.query("SELECT id FROM university_settings WHERE id = 'default'");
    if (res.rows.length === 0) {
      await pool.query(
        "INSERT INTO university_settings (id, university_name, primary_color, logo_url, updated_at) VALUES ($1, $2, $3, $4, $5)",
        ['default', 'EduChain University', '#06b6d4', '', Date.now()]
      );
    }
    
    console.log("Branding table success.");
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
