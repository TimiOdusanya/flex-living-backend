import axios from 'axios';
import { HostawayReview, NormalizedReview } from '../types';

export class HostawayService {
  private apiKey: string;
  private accountId: string;
  private baseUrl = 'https://api.hostaway.com/v1';

  constructor(apiKey: string, accountId: string) {
    this.apiKey = apiKey;
    this.accountId = accountId;
  }

  async fetchReviews(): Promise<HostawayReview[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/reviews`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          accountId: this.accountId
        }
      });

      return response.data.result || [];
    } catch (error: any) {
      if (error.response?.status === 403) {
        console.log('Hostaway API access denied (sandbox mode) - using mock data');
        return this.getMockReviews();
      }
      
      console.error('Error fetching Hostaway reviews:', error.message);
      return this.getMockReviews();
    }
  }

  normalizeReviews(reviews: HostawayReview[]): NormalizedReview[] {
    return reviews.map(review => {
      const categories = this.extractCategories(review.reviewCategory);
      const overallRating = this.calculateOverallRating(categories);

      return {
        id: review.id,
        type: review.type,
        status: review.status,
        overallRating,
        publicReview: review.publicReview,
        categories,
        submittedAt: new Date(review.submittedAt),
        guestName: review.guestName,
        listingName: review.listingName,
        channel: 'hostaway',
        isApproved: false,
        propertyId: this.extractPropertyId(review.listingName)
      };
    });
  }

  private extractCategories(reviewCategories: any[]): NormalizedReview['categories'] {
    const categories = {
      cleanliness: 0,
      communication: 0,
      respect_house_rules: 0,
      check_in: 0,
      value: 0,
      location: 0
    };

    reviewCategories.forEach(category => {
      const key = category.category as keyof typeof categories;
      if (key in categories) {
        categories[key] = category.rating;
      }
    });

    return categories;
  }

  private calculateOverallRating(categories: NormalizedReview['categories']): number {
    const values = Object.values(categories).filter(rating => rating > 0);
    return values.length > 0 ? values.reduce((sum, rating) => sum + rating, 0) / values.length : 0;
  }

  private extractPropertyId(listingName: string): string {
    // Convert to lowercase and replace spaces with dashes, but handle special cases
    let propertyId = listingName.toLowerCase().replace(/\s+/g, '-');
    
    // Handle specific property name mappings to match the property service
    const propertyMappings: { [key: string]: string } = {
      '2b-n1-a---29-shoreditch-heights': '2b-n1-a-29-shoreditch-heights',
      'luxury-loft-in-manhattan': 'luxury-loft-manhattan',
      'modern-studio-in-brooklyn': 'modern-studio-brooklyn',
      'cozy-apartment-in-queens': 'cozy-apartment-queens',
      'penthouse-with-city-views': 'penthouse-city-views'
    };
    
    return propertyMappings[propertyId] || propertyId;
  }

  private getMockReviews(): HostawayReview[] {
    return [
      {
        id: 7453,
        type: 'host-to-guest',
        status: 'published',
        rating: null,
        publicReview: 'Shane and family are wonderful! Would definitely host again :)',
        reviewCategory: [
          { category: 'cleanliness', rating: 10 },
          { category: 'communication', rating: 10 },
          { category: 'respect_house_rules', rating: 10 }
        ],
        submittedAt: '2020-08-21 22:45:14',
        guestName: 'Shane Finkelstein',
        listingName: '2B N1 A - 29 Shoreditch Heights'
      },
      {
        id: 7454,
        type: 'guest-to-host',
        status: 'published',
        rating: 9,
        publicReview: 'Amazing stay! The apartment was spotless and the location was perfect. Highly recommend!',
        reviewCategory: [
          { category: 'cleanliness', rating: 10 },
          { category: 'communication', rating: 9 },
          { category: 'respect_house_rules', rating: 9 },
          { category: 'check_in', rating: 10 },
          { category: 'value', rating: 8 },
          { category: 'location', rating: 10 }
        ],
        submittedAt: '2023-12-15 14:30:22',
        guestName: 'Sarah Johnson',
        listingName: 'Luxury Loft in Manhattan'
      },
      {
        id: 7455,
        type: 'guest-to-host',
        status: 'published',
        rating: 8,
        publicReview: 'Great place with excellent amenities. The host was very responsive and helpful.',
        reviewCategory: [
          { category: 'cleanliness', rating: 8 },
          { category: 'communication', rating: 9 },
          { category: 'respect_house_rules', rating: 8 },
          { category: 'check_in', rating: 9 },
          { category: 'value', rating: 7 },
          { category: 'location', rating: 8 }
        ],
        submittedAt: '2023-12-10 09:15:45',
        guestName: 'Michael Chen',
        listingName: 'Modern Studio in Brooklyn'
      },
      {
        id: 7456,
        type: 'guest-to-host',
        status: 'pending',
        rating: 7,
        publicReview: 'Good location but the apartment was a bit noisy. Overall decent stay.',
        reviewCategory: [
          { category: 'cleanliness', rating: 7 },
          { category: 'communication', rating: 8 },
          { category: 'respect_house_rules', rating: 7 },
          { category: 'check_in', rating: 8 },
          { category: 'value', rating: 6 },
          { category: 'location', rating: 9 }
        ],
        submittedAt: '2023-12-08 16:45:12',
        guestName: 'Emma Wilson',
        listingName: 'Cozy Apartment in Queens'
      },
      {
        id: 7457,
        type: 'guest-to-host',
        status: 'published',
        rating: 10,
        publicReview: 'Absolutely perfect! Everything exceeded our expectations. Will definitely book again.',
        reviewCategory: [
          { category: 'cleanliness', rating: 10 },
          { category: 'communication', rating: 10 },
          { category: 'respect_house_rules', rating: 10 },
          { category: 'check_in', rating: 10 },
          { category: 'value', rating: 10 },
          { category: 'location', rating: 10 }
        ],
        submittedAt: '2023-12-05 11:20:33',
        guestName: 'David Rodriguez',
        listingName: 'Penthouse with City Views'
      }
    ];
  }
}
