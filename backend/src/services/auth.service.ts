import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../database/supabase.js';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'staff';
}

export interface LoginInput {
  email: string;
  password: string;
}

class AuthService {
  async register(input: CreateUserInput) {
    const { name, email, password, role = 'staff' } = input;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({ name, email, password: hashedPassword, role })
      .select('id, name, email, role, created_at')
      .single();

    if (error || !user) {
      throw new Error('Failed to create user: ' + (error?.message || 'Unknown error'));
    }

    // Generate JWT token
    const token = this.generateToken(user);

    return { token, user };
  }

  async login(input: LoginInput) {
    const { email, password } = input;

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, password, role')
      .eq('email', email)
      .single();

    if (!user || error) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = this.generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const { password: _pwd, ...userWithoutPassword } = user;
    void _pwd;

    return { token, user: userWithoutPassword };
  }

  async getProfile(userId: string) {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .eq('id', userId)
      .single();

    if (!user || error) {
      throw new Error('User not found');
    }

    return user;
  }

  private generateToken(user: { id: string; email: string; role: string }): string {
    const secret = process.env.JWT_SECRET || 'secret';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      secret,
      { expiresIn } as jwt.SignOptions
    );
  }
}

export const authService = new AuthService();
