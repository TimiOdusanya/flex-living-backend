import axios from 'axios';
import { GooglePlaceResult, GooglePlaceReview, NormalizedReview } from '../types';

export class GooglePlacesService {
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api/place';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchPlaces(query: string): Promise<GooglePlaceResult[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/textsearch/json`, {
        params: {
          query,
          key: this.apiKey,
          type: 'lodging'
        }
      });

      return response.data.results || [];
    } catch (error) {
      console.error('Error searching Google Places:', error);
      return [];
    }
  }

  async getPlaceDetails(placeId: string): Promise<GooglePlaceResult | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/details/json`, {
        params: {
          place_id: placeId,
          key: this.apiKey,
          fields: 'place_id,name,rating,user_ratings_total,reviews,formatted_address,geometry'
        }
      });

      return response.data.result || null;
    } catch (error) {
      console.error('Error fetching place details:', error);
      return null;
    }
  }

  normalizeGoogleReviews(placeDetails: GooglePlaceResult, propertyName: string): NormalizedReview[] {
    if (!placeDetails.reviews) return [];

    return placeDetails.reviews.map((review, index) => ({
      id: Date.now() + index + 10000,
      type: 'guest-to-host' as const,
      status: 'published' as const,
      overallRating: review.rating,
      publicReview: review.text,
      categories: {
        cleanliness: this.mapRating(review.rating),
        communication: this.mapRating(review.rating),
        respect_house_rules: this.mapRating(review.rating),
        check_in: this.mapRating(review.rating),
        value: this.mapRating(review.rating),
        location: this.mapRating(review.rating)
      },
      submittedAt: new Date(review.time * 1000),
      guestName: review.author_name,
      listingName: propertyName,
      channel: 'google' as const,
      isApproved: false,
      propertyId: this.extractPropertyId(propertyName)
    }));
  }

  private mapRating(rating: number): number {
    return Math.round((rating / 5) * 10);
  }

  private extractPropertyId(propertyName: string): string {
    return propertyName.replace(/\s+/g, '-').toLowerCase();
  }

  async getMockGoogleReviews(): Promise<NormalizedReview[]> {
    return [
      {
        id: 20001,
        type: 'guest-to-host',
        status: 'published',
        overallRating: 9,
        publicReview: 'Excellent location and beautiful property. The host was very accommodating and the check-in process was smooth.',
        categories: {
          cleanliness: 9,
          communication: 9,
          respect_house_rules: 9,
          check_in: 10,
          value: 8,
          location: 10
        },
        submittedAt: new Date('2023-12-12T10:30:00Z'),
        guestName: 'Jennifer Martinez',
        listingName: 'Luxury Loft in Manhattan',
        channel: 'google',
        isApproved: false,
        propertyId: 'luxury-loft-manhattan'
      },
      {
        id: 20002,
        type: 'guest-to-host',
        status: 'published',
        overallRating: 8,
        publicReview: 'Great place to stay! Clean, comfortable, and well-equipped. The neighborhood is quiet and safe.',
        categories: {
          cleanliness: 8,
          communication: 8,
          respect_house_rules: 8,
          check_in: 9,
          value: 8,
          location: 8
        },
        submittedAt: new Date('2023-12-10T15:45:00Z'),
        guestName: 'Robert Kim',
        listingName: 'Modern Studio in Brooklyn',
        channel: 'google',
        isApproved: false,
        propertyId: 'modern-studio-brooklyn'
      }
    ];
  }
}
