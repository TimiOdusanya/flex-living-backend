import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Manager } from '../types';

export class AuthController {
  private managers: Manager[] = [];
  private jwtSecret: string;

  constructor(jwtSecret: string) {
    this.jwtSecret = jwtSecret;
    this.initializeManagers();
  }

  private async initializeManagers() {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    this.managers = [
      {
        id: '1',
        email: 'admin@flexliving.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'admin',
        createdAt: new Date()
      },
      {
        id: '2',
        email: 'manager@flexliving.com',
        password: hashedPassword,
        name: 'Property Manager',
        role: 'manager',
        createdAt: new Date()
      }
    ];
  }

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email and password are required' 
        });
      }

      const manager = this.managers.find(m => m.email === email);
      if (!manager) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }

      const isValidPassword = await bcrypt.compare(password, manager.password);
      if (!isValidPassword) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }

      const token = jwt.sign(
        { 
          id: manager.id, 
          email: manager.email, 
          role: manager.role 
        },
        this.jwtSecret,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: manager.id,
            email: manager.email,
            name: manager.name,
            role: manager.role
          }
        }
      });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  register = async (req: Request, res: Response) => {
    try {
      const { email, password, name, role = 'manager' } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email, password, and name are required' 
        });
      }

      const existingManager = this.managers.find(m => m.email === email);
      if (existingManager) {
        return res.status(409).json({ 
          success: false, 
          message: 'Manager with this email already exists' 
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newManager: Manager = {
        id: (this.managers.length + 1).toString(),
        email,
        password: hashedPassword,
        name,
        role: role as 'admin' | 'manager',
        createdAt: new Date()
      };

      this.managers.push(newManager);

      const token = jwt.sign(
        { 
          id: newManager.id, 
          email: newManager.email, 
          role: newManager.role 
        },
        this.jwtSecret,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        success: true,
        data: {
          token,
          user: {
            id: newManager.id,
            email: newManager.email,
            name: newManager.name,
            role: newManager.role
          }
        }
      });
    } catch (error) {
      console.error('Error during registration:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  getProfile = async (req: Request, res: Response) => {
    try {
      const manager = this.managers.find(m => m.id === (req as any).user.id);
      if (!manager) {
        return res.status(404).json({ 
          success: false, 
          message: 'Manager not found' 
        });
      }

      res.json({
        success: true,
        data: {
          id: manager.id,
          email: manager.email,
          name: manager.name,
          role: manager.role,
          createdAt: manager.createdAt
        }
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
}
