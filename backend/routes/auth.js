
import express from 'express';
import { body, query } from 'express-validator';
import { createProfileController, getProfileByEmail } from '../controllers/authController.js';


const router = express.Router();

router.post(
  '/profile',
  [
    body('id').isUUID().withMessage('Invalid Supabase UID'),
    body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').isEmail().withMessage('Invalid email'),
  ],
  createProfileController
);

router.get(
  '/profile',
  [query('email').isEmail().withMessage('Invalid email')],
  getProfileByEmail
);

export default router;
