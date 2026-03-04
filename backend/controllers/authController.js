
import { validationResult } from 'express-validator';
import { createProfile, findProfileByEmail } from '../models/userModel.js';


// Create profile after Supabase Auth signup
export async function createProfileController(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { id, email, username } = req.body;
  try {
    const existing = await findProfileByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    const profile = await createProfile({ id, email, username });
    res.status(201).json({ profile });
  } catch (err) {
    console.error('Create profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}


// Get profile by email (optional, for frontend use)
export async function getProfileByEmail(req, res) {
  const { email } = req.query;
  try {
    const profile = await findProfileByEmail(email);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json({ profile });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}
