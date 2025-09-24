import { Router } from 'express';
import { ReviewController } from '../controllers/reviewController';
import { authenticateToken, requireManager } from '../middleware/auth';

export const createReviewRoutes = (reviewController: ReviewController) => {
  const router = Router();

  router.get('/', authenticateToken, requireManager, reviewController.getReviews);
  router.get('/approved', reviewController.getApprovedReviews);
  router.get('/dashboard-stats', authenticateToken, requireManager, reviewController.getDashboardStats);
  router.get('/properties', reviewController.getProperties);
  router.patch('/:reviewId/approve', authenticateToken, requireManager, reviewController.approveReview);
  router.patch('/:reviewId/reject', authenticateToken, requireManager, reviewController.rejectReview);

  return router;
};
