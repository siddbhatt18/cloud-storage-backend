import { Router } from 'express';
import { register, login } from '../controllers/authController';

const router = Router();

// POST http://localhost:5000/api/auth/register
router.post('/register', register);

// POST http://localhost:5000/api/auth/login
router.post('/login', login);

export default router;