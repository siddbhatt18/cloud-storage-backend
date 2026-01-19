import { Router } from 'express';
import { createFolder } from '../controllers/folderController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.post('/', requireAuth, createFolder); // POST /api/folders

export default router;