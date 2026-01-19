import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

// Add a custom property to the Request type so TypeScript doesn't complain
export interface AuthRequest extends Request {
  user?: any;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  // 1. Get the token from the "Authorization" header
  const token = req.headers.authorization?.split(' ')[1]; // Format: "Bearer <token>"

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }

  // 2. Verify token with Supabase
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
    return;
  }

  // 3. Attach user to the request object so next functions can use it
  req.user = user;
  
  // 4. Move to the next step
  next();
};