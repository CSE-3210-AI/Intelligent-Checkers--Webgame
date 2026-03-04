import pool from '../config/db.js';

export async function createProfile({ id, email, username }) {
  const result = await pool.query(
    `INSERT INTO profiles (id, email, username)
     VALUES ($1, $2, $3) RETURNING id, email, username`,
    [id, email, username]
  );
  return result.rows[0];
}

export async function findProfileByEmail(email) {
  const result = await pool.query(
    `SELECT * FROM profiles WHERE email = $1`,
    [email]
  );
  return result.rows[0];
}
