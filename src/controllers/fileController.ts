import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/authMiddleware';
import { v4 as uuidv4 } from 'uuid'; 

export const uploadFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const file = req.file;
    const user = req.user;

    // 1. Check if file exists
    if (!file || !user) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // 2. Prepare file path (e.g., "user_id/random-id.png")
    const fileExt = file.originalname.split('.').pop();
    const filePath = `${user.id}/${uuidv4()}.${fileExt}`;

    // 3. Upload to Supabase Storage
    const { data: storageData, error: uploadError } = await supabase.storage
      .from('cloud-storage')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) throw uploadError;

    // 4. Save Metadata to Database
    const { data: dbData, error: dbError } = await supabase
      .from('files')
      .insert({
        name: file.originalname,
        size: file.size,
        mime_type: file.mimetype,
        storage_key: filePath,
        owner_id: user.id
      })
      .select()
      .single();

    if (dbError) throw dbError;

    res.status(201).json({ message: 'File uploaded successfully', file: dbData });

  } catch (error: any) {
    console.error('Upload Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// 2. List Files (Fetch all files for the user)
export const listFiles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    
    // Get files that belong to user AND are not in trash
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

// 3. Rename File
export const renameFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // Get file ID from URL
    const { name } = req.body; // Get new name from Body

    const { data, error } = await supabase
      .from('files')
      .update({ name: name })
      .eq('id', id)
      .eq('owner_id', req.user.id) // Security check: Ensure they own the file
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ message: 'File renamed', file: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 4. Soft Delete (Move to Trash)
export const deleteFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // We don't actually delete the row. We just set is_deleted = true.
    const { data, error } = await supabase
      .from('files')
      .update({ is_deleted: true })
      .eq('id', id)
      .eq('owner_id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ message: 'File moved to trash', file: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 5. Get Secure Link (Signed URL)
export const getFileLink = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;

    // 1. Get file path from DB
    const { data: fileRecord, error: dbError } = await supabase
      .from('files')
      .select('storage_key')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

    if (dbError || !fileRecord) {
       res.status(404).json({ error: 'File not found or access denied' });
       return;
    }

    // 2. Generate Signed URL (Valid for 60 seconds)
    const { data, error: storageError } = await supabase
      .storage
      .from('cloud-storage')
      .createSignedUrl(fileRecord.storage_key, 60); // 60 seconds expiry

    if (storageError) throw storageError;

    res.status(200).json({ signedUrl: data.signedUrl });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 6. Search Files
export const searchFiles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { q } = req.query; // Get search query from URL (e.g., ?q=invoice)
    const user = req.user;

    if (!q) {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    // Use Full-Text Search to find matching files
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('owner_id', user.id)
      .eq('is_deleted', false)
      // This performs the magic "fuzzy" search
      .textSearch('name', `'${q}'`, {
        config: 'english',
        type: 'plain' // 'plain' treats input as text, not complex search logic
      });

    if (error) throw error;

    res.status(200).json(data);

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};