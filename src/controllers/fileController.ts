import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/authMiddleware';

// 1. Upload File
export const uploadFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const file = req.file;
    const user = req.user;

    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Create a unique file path: userId/timestamp_filename
    const filePath = `${user.id}/${Date.now()}_${file.originalname}`;

    // Upload to Supabase Storage
    const { data: storageData, error: storageError } = await supabase
      .storage
      .from('cloud-storage')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
      });

    if (storageError) throw storageError;

    // Save metadata to Database
    const { data: dbData, error: dbError } = await supabase
      .from('files')
      .insert([
        {
          name: file.originalname,
          size: file.size,
          mime_type: file.mimetype,
          storage_key: filePath,
          owner_id: user.id,
        },
      ])
      .select()
      .single();

    if (dbError) throw dbError;

    res.status(201).json(dbData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 2. List Files (Active only)
export const listFiles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('owner_id', user.id)
      .eq('is_deleted', false) // Only show active files
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Search Files
export const searchFiles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { q } = req.query;
    const user = req.user;

    if (!q) {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('owner_id', user.id)
      .eq('is_deleted', false)
      .textSearch('name', `'${q}'`, {
        config: 'english',
        type: 'plain'
      });

    if (error) throw error;

    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 4. Rename File
export const renameFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const user = req.user;

    const { data, error } = await supabase
      .from('files')
      .update({ name })
      .eq('id', id)
      .eq('owner_id', user.id)
      .select();

    if (error) throw error;
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 5. Soft Delete (Move to Trash)
export const deleteFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;

    // We don't actually delete, we just set flag to true
    const { error } = await supabase
      .from('files')
      .update({ is_deleted: true })
      .eq('id', id)
      .eq('owner_id', user.id);

    if (error) throw error;
    res.status(200).json({ message: 'File moved to trash' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 6. Get Download Link
export const getFileLink = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;

    // 1. Get storage_key from DB to ensure ownership
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('storage_key')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

    if (fetchError || !file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    // 2. Generate Signed URL (valid for 1 hour)
    const { data, error: signError } = await supabase
      .storage
      .from('cloud-storage')
      .createSignedUrl(file.storage_key, 3600);

    if (signError) throw signError;

    res.status(200).json({ signedUrl: data.signedUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 7. Get Trash Files
export const getTrashFiles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('owner_id', user.id)
      .eq('is_deleted', true) // Only deleted files
      .order('updated_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 8. Restore File
export const restoreFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('files')
      .update({ is_deleted: false }) // Bring it back!
      .eq('id', id)
      .eq('owner_id', req.user.id);

    if (error) throw error;
    res.status(200).json({ message: 'File restored' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 9. Permanently Delete
export const deleteFilePermanently = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;

    // 1. Get file path to delete from Storage
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('storage_key')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

    if (fetchError || !file) return;

    // 2. Remove from Storage Bucket
    const { error: storageError } = await supabase
      .storage
      .from('cloud-storage')
      .remove([file.storage_key]);

    if (storageError) throw storageError;

    // 3. Remove from Database
    const { error: dbError } = await supabase
      .from('files')
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id);

    if (dbError) throw dbError;

    res.status(200).json({ message: 'File deleted permanently' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 10. Toggle Favorite
export const toggleFavorite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;

    // 1. Check current status
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('is_favorite')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

    if (fetchError || !file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    // 2. Toggle the status (true -> false, or false -> true)
    const newStatus = !file.is_favorite;

    const { error: updateError } = await supabase
      .from('files')
      .update({ is_favorite: newStatus })
      .eq('id', id)
      .eq('owner_id', user.id);

    if (updateError) throw updateError;

    res.status(200).json({ message: 'Favorite updated', is_favorite: newStatus });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
