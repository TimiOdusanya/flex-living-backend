import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

export const createAuthRoutes = (authController: AuthController) => {
  const router = Router();

  router.post('/login', authController.login);
  router.post('/register', authController.register);
  router.get('/profile', authenticateToken, authController.getProfile);

  return router;
};
