import { Router } from 'express';
import { shareFile } from '../controllers/shareController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Share a file with another user (POST /api/shares) [cite: 21, 130]
router.post('/', requireAuth, shareFile);

export default router;