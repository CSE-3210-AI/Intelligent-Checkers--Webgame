import pool from '../config/db.js';

export async function createUser({ username, email, hashedPassword }) {
  const result = await pool.query(
    `INSERT INTO users (username, email, password, created_at)
     VALUES ($1, $2, $3, NOW()) RETURNING id, username, email, created_at`,
    [username, email, hashedPassword]
  );
  return result.rows[0];
}

export async function findUserByEmail(email) {
  const result = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  return result.rows[0];
}
