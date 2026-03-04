import bcrypt from 'bcrypt';
import { validationResult } from 'express-validator';
import { createUser, findUserByEmail } from '../models/userModel.js';

export async function signup(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { username, email, password } = req.body;
  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser({ username, email, hashedPassword });
    res.status(201).json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function signin(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { email, password } = req.body;
  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ user: { id: user.id, username: user.username, email: user.email, created_at: user.created_at } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}
