import db, { initDatabase } from './database/db.js';

async function check() {
  await initDatabase(); // Ensure the latest users are created
  const user = await db.getAsync('SELECT * FROM users WHERE email = ?', ['beraa634@gmail.com']);
  console.log('USER_CHECK_RESULT:', user ? 'FOUND' : 'NOT_FOUND');
  if (user) console.log('USER_DETAILS:', JSON.stringify(user));
  process.exit(0);
}

check();
