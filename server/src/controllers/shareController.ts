import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/authMiddleware';

// Share a file with another user by email
export const shareFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fileId, targetEmail, role } = req.body; // e.g., role = 'viewer'
    const user = req.user;

    // 1. Check if file belongs to you
    const { data: fileCheck, error: fileError } = await supabase
      .from('files')
      .select('id')
      .eq('id', fileId)
      .eq('owner_id', user.id)
      .single();

    if (fileError || !fileCheck) {
      res.status(403).json({ error: 'You do not own this file' });
      return;
    }

    // 2. Add entry to Shares table
    const { data, error } = await supabase
      .from('shares')
      .insert({
        file_id: fileId,
        shared_with_email: targetEmail,
        role: role || 'viewer',
        owner_id: user.id
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: `File shared with ${targetEmail}`, share: data });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};