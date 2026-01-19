import { Router } from 'express';
import multer from 'multer';
import { 
  uploadFile, 
  listFiles, 
  renameFile, 
  deleteFile, 
  getFileLink,
  searchFiles 
} from '../controllers/fileController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Configure Multer to hold file in memory (RAM) temporarily
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 1. Upload File (POST /api/files/upload)
router.post('/upload', requireAuth, upload.single('file'), uploadFile);

// 2. List All Files (GET /api/files)
router.get('/', requireAuth, listFiles);

// 3. Search Files (GET /api/files/search)
// CRITICAL: This route must come BEFORE /:id routes.
// If it comes after, Express will think the word "search" is a File ID.
router.get('/search', requireAuth, searchFiles);

// 4. Rename File (PATCH /api/files/:id)
router.patch('/:id', requireAuth, renameFile);

// 5. Move to Trash / Soft Delete (DELETE /api/files/:id)
router.delete('/:id', requireAuth, deleteFile);

// 6. Get Secure Download Link (GET /api/files/:id/link)
router.get('/:id/link', requireAuth, getFileLink);

export default router;