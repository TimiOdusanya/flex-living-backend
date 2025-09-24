import { Router } from 'express';
import { GoogleReviewsController } from '../controllers/googleReviewsController';

export const createGoogleReviewsRoutes = (googleReviewsController: GoogleReviewsController) => {
  const router = Router();

  router.get('/places/search', googleReviewsController.searchPlaces);
  router.get('/places/:placeId', googleReviewsController.getPlaceDetails);
  router.get('/places/:placeId/reviews', googleReviewsController.getPlaceReviews);
  router.get('/reviews/search', googleReviewsController.searchReviewsByProperty);

  return router;
};
