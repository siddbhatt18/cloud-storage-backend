import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import Routes
import authRoutes from './routes/authRoutes';
import fileRoutes from './routes/fileRoutes';
import folderRoutes from './routes/folderRoutes';
import shareRoutes from './routes/shareRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Allows parsing JSON bodies

// Register Routes
app.use('/api/auth', authRoutes);       // Login/Register
app.use('/api/files', fileRoutes);      // Upload, Rename, Delete, List
app.use('/api/folders', folderRoutes);  // Create Folders
app.use('/api/shares', shareRoutes);    // Sharing features

// Basic Test Route
app.get('/', (req, res) => {
  res.json({ message: 'Cloud Storage API is Running!' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});