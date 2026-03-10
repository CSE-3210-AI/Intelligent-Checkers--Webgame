import { validationResult } from 'express-validator';
import { supabaseAdmin } from '../config/supabase.js';

export async function signup(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { username, email, password } = req.body;
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { username },
      email_confirm: true,
    });
    if (error) {
      const status = error.status || 400;
      return res.status(status).json({ error: error.message });
    }
    res.status(201).json({
      user: {
        id: data.user.id,
        email: data.user.email,
        username: data.user.user_metadata?.username,
        created_at: data.user.created_at,
      },
    });
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
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
    if (error) {
      return res.status(401).json({ error: error.message });
    }
    res.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        username: data.user.user_metadata?.username || data.user.email,
        created_at: data.user.created_at,
      },
      session: data.session,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}
