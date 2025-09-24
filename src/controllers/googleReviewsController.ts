import { Request, Response } from 'express';
import { GooglePlacesService } from '../services/googlePlacesService';

export class GoogleReviewsController {
  private googlePlacesService: GooglePlacesService;

  constructor(googlePlacesService: GooglePlacesService) {
    this.googlePlacesService = googlePlacesService;
  }

  searchPlaces = async (req: Request, res: Response) => {
    try {
      const { query, location, radius } = req.query;
      
      if (!query) {
        return res.status(400).json({ 
          success: false, 
          message: 'Query parameter is required' 
        });
      }

      const places = await this.googlePlacesService.searchPlaces(query as string);
      res.json({ success: true, data: places });
    } catch (error) {
      console.error('Error searching places:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  getPlaceDetails = async (req: Request, res: Response) => {
    try {
      const { placeId } = req.params;
      
      if (!placeId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Place ID is required' 
        });
      }

      const placeDetails = await this.googlePlacesService.getPlaceDetails(placeId);
      
      if (!placeDetails) {
        return res.status(404).json({ 
          success: false, 
          message: 'Place not found' 
        });
      }

      res.json({ success: true, data: placeDetails });
    } catch (error) {
      console.error('Error fetching place details:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  getPlaceReviews = async (req: Request, res: Response) => {
    try {
      const { placeId } = req.params;
      
      if (!placeId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Place ID is required' 
        });
      }

      const placeDetails = await this.googlePlacesService.getPlaceDetails(placeId);
      
      if (!placeDetails) {
        return res.status(404).json({ 
          success: false, 
          message: 'Place not found' 
        });
      }

      const normalizedReviews = this.googlePlacesService.normalizeGoogleReviews(
        placeDetails, 
        placeDetails.name
      );

      res.json({ success: true, data: normalizedReviews });
    } catch (error) {
      console.error('Error fetching place reviews:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  searchReviewsByProperty = async (req: Request, res: Response) => {
    try {
      const { propertyName, location } = req.query;
      
      if (!propertyName) {
        return res.status(400).json({ 
          success: false, 
          message: 'Property name is required' 
        });
      }

      const searchQuery = `${propertyName} ${location || 'London UK'}`;
      const places = await this.googlePlacesService.searchPlaces(searchQuery);
      
      if (places.length === 0) {
        return res.json({ success: true, data: [] });
      }

      const placeDetails = await this.googlePlacesService.getPlaceDetails(places[0].place_id);
      
      if (!placeDetails) {
        return res.json({ success: true, data: [] });
      }

      const normalizedReviews = this.googlePlacesService.normalizeGoogleReviews(
        placeDetails, 
        placeDetails.name
      );

      res.json({ success: true, data: normalizedReviews });
    } catch (error) {
      console.error('Error searching reviews by property:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
}
