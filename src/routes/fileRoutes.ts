import { Router } from 'express';
import multer from 'multer';
import { 
  uploadFile, 
  listFiles, 
  renameFile, 
  deleteFile, 
  getFileLink,
  searchFiles,
  getTrashFiles,
  restoreFile,
  deleteFilePermanently,
  toggleFavorite // <--- New Import
} from '../controllers/fileController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Configure Multer to hold file in memory (RAM) temporarily
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 1. Upload File
router.post('/upload', requireAuth, upload.single('file'), uploadFile);

// 2. List Active Files
router.get('/', requireAuth, listFiles);

// 3. Special Routes (MUST be defined before /:id routes)
router.get('/search', requireAuth, searchFiles);
router.get('/trash', requireAuth, getTrashFiles);

// 4. File Specific Operations (Require ID)
router.patch('/:id', requireAuth, renameFile);         // Rename
router.patch('/:id/favorite', requireAuth, toggleFavorite); // Toggle Favorite (New)
router.delete('/:id', requireAuth, deleteFile);        // Soft Delete (Move to Trash)
router.get('/:id/link', requireAuth, getFileLink);     // Get Download/Share Link

// 5. Trash Operations
router.post('/:id/restore', requireAuth, restoreFile); // Restore from Trash
router.delete('/:id/permanent', requireAuth, deleteFilePermanently); // Delete Forever

export default router;
