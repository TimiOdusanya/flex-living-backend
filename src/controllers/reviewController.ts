import { Request, Response } from 'express';
import { ReviewService } from '../services/reviewService';
import { ReviewFilters } from '../types';

export class ReviewController {
  private reviewService: ReviewService;

  constructor(reviewService: ReviewService) {
    this.reviewService = reviewService;
  }

  getReviews = async (req: Request, res: Response) => {
    try {
      const filters: ReviewFilters = {
        propertyId: req.query.propertyId as string,
        rating: req.query.rating ? Number(req.query.rating) : undefined,
        category: req.query.category as string,
        channel: req.query.channel as string,
        status: req.query.status as string,
        isApproved: req.query.isApproved ? req.query.isApproved === 'true' : undefined,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string
      };

      const reviews = this.reviewService.getReviews(filters);
      res.json({ success: true, data: reviews });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  getApprovedReviews = async (req: Request, res: Response) => {
    try {
      const propertyId = req.query.propertyId as string;
      const reviews = this.reviewService.getApprovedReviews(propertyId);
      res.json({ success: true, data: reviews });
    } catch (error) {
      console.error('Error fetching approved reviews:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  approveReview = async (req: Request, res: Response) => {
    try {
      const { reviewId } = req.params;
      const success = await this.reviewService.approveReview(Number(reviewId));
      
      if (success) {
        // Refresh approval status in memory
        this.reviewService.refreshApprovalStatus();
        res.json({ success: true, message: 'Review approved successfully' });
      } else {
        res.status(404).json({ success: false, message: 'Review not found' });
      }
    } catch (error) {
      console.error('Error approving review:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  rejectReview = async (req: Request, res: Response) => {
    try {
      const { reviewId } = req.params;
      const success = await this.reviewService.rejectReview(Number(reviewId));
      
      if (success) {
        // Refresh approval status in memory
        this.reviewService.refreshApprovalStatus();
        res.json({ success: true, message: 'Review rejected successfully' });
      } else {
        res.status(404).json({ success: false, message: 'Review not found' });
      }
    } catch (error) {
      console.error('Error rejecting review:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  getDashboardStats = async (req: Request, res: Response) => {
    try {
      const stats = this.reviewService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  getProperties = async (req: Request, res: Response) => {
    try {
      const properties = this.reviewService.getProperties();
      res.json({ success: true, data: properties });
    } catch (error) {
      console.error('Error fetching properties:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
}
