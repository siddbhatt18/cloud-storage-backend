import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/authMiddleware';

export const createFolder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, parent_id } = req.body;
    const user = req.user;

    const { data, error } = await supabase
      .from('folders')
      .insert({
        name: name,
        owner_id: user.id,
        parent_id: parent_id || null // If null, it's in the Root directory
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Folder created', folder: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};