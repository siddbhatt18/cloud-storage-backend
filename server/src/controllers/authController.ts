import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

// 1. Register User
export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, fullName } = req.body;

  try {
    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }, // Save their name as metadata
      },
    });

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(201).json({ message: 'User registered successfully!', user: data.user });
  } catch (err) {
    res.status(500).json({ error: 'Server error during registration' });
  }
};

// 2. Login User
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    // Check credentials with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      res.status(401).json({ error: error.message });
      return;
    }

    // Return the session (contains the Access Token usually needed for frontend)
    res.status(200).json({ 
      message: 'Login successful', 
      token: data.session.access_token,
      user: data.user 
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error during login' });
  }
};