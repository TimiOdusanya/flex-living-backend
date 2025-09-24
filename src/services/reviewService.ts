import { NormalizedReview, ReviewFilters, DashboardStats, Property } from '../types';
import { HostawayService } from './hostawayService';
import { GooglePlacesService } from './googlePlacesService';
import { StorageManager } from '../utils/storage';

export class ReviewService {
  private hostawayService: HostawayService;
  private googlePlacesService: GooglePlacesService;
  private reviews: NormalizedReview[] = [];
  private properties: Property[] = [];

  constructor(hostawayApiKey: string, hostawayAccountId: string, googleApiKey: string) {
    this.hostawayService = new HostawayService(hostawayApiKey, hostawayAccountId);
    this.googlePlacesService = new GooglePlacesService(googleApiKey);
    StorageManager.initialize();
    this.initializeData();
  }

  private async initializeData() {
    await this.loadReviews();
    this.generateProperties();
  }

  async loadReviews(): Promise<void> {
    try {
      // Check if we have stored reviews
      const storedReviews = StorageManager.getReviews();
      if (storedReviews.length > 0) {
        this.reviews = storedReviews;
        console.log(`Loaded ${this.reviews.length} reviews from storage`);
        return;
      }

      // Load fresh reviews if no stored data
      const hostawayReviews = await this.hostawayService.fetchReviews();
      const normalizedHostaway = this.hostawayService.normalizeReviews(hostawayReviews);
      
      const mockGoogleReviews = await this.googlePlacesService.getMockGoogleReviews();
      
      this.reviews = [...normalizedHostaway, ...mockGoogleReviews];
      
      // Apply stored approval statuses
      this.applyApprovalStatuses();
      
      // Save to storage
      StorageManager.setReviews(this.reviews);
      
      console.log(`Loaded ${this.reviews.length} reviews (${normalizedHostaway.length} from Hostaway, ${mockGoogleReviews.length} from Google Places)`);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  }

  private applyApprovalStatuses() {
    const approvals = StorageManager.getAllApprovals();
    this.reviews.forEach(review => {
      const approvalStatus = StorageManager.getApprovalStatus(review.id);
      review.isApproved = approvalStatus === 'approved';
      review.status = approvalStatus === 'approved' ? 'published' : 
                    approvalStatus === 'rejected' ? 'rejected' : 'pending';
    });
  }

  refreshApprovalStatus(): void {
    this.applyApprovalStatuses();
  }

  getReviews(filters: ReviewFilters = {}): NormalizedReview[] {
    let filteredReviews = [...this.reviews];

    if (filters.propertyId) {
      filteredReviews = filteredReviews.filter(review => 
        review.propertyId === filters.propertyId
      );
    }

    if (filters.rating) {
      filteredReviews = filteredReviews.filter(review => 
        review.overallRating >= (filters.rating || 0)
      );
    }

    if (filters.category) {
      filteredReviews = filteredReviews.filter(review => 
        review.categories[filters.category as keyof typeof review.categories] > 0
      );
    }

    if (filters.channel) {
      filteredReviews = filteredReviews.filter(review => 
        review.channel === filters.channel
      );
    }

    if (filters.status) {
      filteredReviews = filteredReviews.filter(review => 
        review.status === filters.status
      );
    }

    if (filters.isApproved !== undefined) {
      filteredReviews = filteredReviews.filter(review => 
        review.isApproved === filters.isApproved
      );
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filteredReviews = filteredReviews.filter(review => 
        review.submittedAt >= fromDate
      );
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      filteredReviews = filteredReviews.filter(review => 
        review.submittedAt <= toDate
      );
    }

    return filteredReviews.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  }

  getApprovedReviews(propertyId?: string): NormalizedReview[] {
    const filters: ReviewFilters = { isApproved: true };
    if (propertyId) {
      filters.propertyId = propertyId;
    }
    return this.getReviews(filters);
  }

  async approveReview(reviewId: number): Promise<boolean> {
    const review = this.reviews.find(r => r.id === reviewId);
    if (review) {
      // Update in memory
      review.isApproved = true;
      review.status = 'published';
      
      // Persist to storage
      StorageManager.approveReview(reviewId);
      
      // Save updated reviews to storage
      StorageManager.setReviews(this.reviews);
      
      console.log(`Review ${reviewId} approved and saved to storage`);
      return true;
    }
    return false;
  }

  async rejectReview(reviewId: number): Promise<boolean> {
    const review = this.reviews.find(r => r.id === reviewId);
    if (review) {
      // Update in memory
      review.isApproved = false;
      review.status = 'rejected';
      
      // Persist to storage
      StorageManager.rejectReview(reviewId);
      
      // Save updated reviews to storage
      StorageManager.setReviews(this.reviews);
      
      console.log(`Review ${reviewId} rejected and saved to storage`);
      return true;
    }
    return false;
  }

  getDashboardStats(): DashboardStats {
    const totalReviews = this.reviews.length;
    const approvedReviews = this.reviews.filter(r => r.isApproved).length;
    const pendingReviews = this.reviews.filter(r => r.status === 'pending').length;
    
    const averageRating = totalReviews > 0 
      ? this.reviews.reduce((sum, review) => sum + review.overallRating, 0) / totalReviews 
      : 0;

    const recentReviews = this.reviews
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
      .slice(0, 5);

    const ratingDistribution = this.reviews.reduce((dist, review) => {
      const rating = Math.round(review.overallRating);
      dist[rating] = (dist[rating] || 0) + 1;
      return dist;
    }, {} as { [key: number]: number });

    const topPerformingProperties = this.properties
      .map(property => {
        const propertyReviews = this.reviews.filter(r => r.propertyId === property.id);
        const avgRating = propertyReviews.length > 0 
          ? propertyReviews.reduce((sum, r) => sum + r.overallRating, 0) / propertyReviews.length 
          : 0;
        return { ...property, averageRating: avgRating };
      })
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 5);

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      approvedReviews,
      pendingReviews,
      propertiesCount: this.properties.length,
      recentReviews,
      topPerformingProperties,
      ratingDistribution
    };
  }

  getProperties(): Property[] {
    return this.properties.map(property => {
      const propertyReviews = this.reviews.filter(r => r.propertyId === property.id);
      const approvedReviews = propertyReviews.filter(r => r.isApproved);
      const averageRating = propertyReviews.length > 0 
        ? propertyReviews.reduce((sum, r) => sum + r.overallRating, 0) / propertyReviews.length 
        : 0;

      return {
        ...property,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: propertyReviews.length,
        approvedReviews: approvedReviews.length
      };
    });
  }

  private generateProperties(): void {
    this.properties = [
      {
        id: '2b-n1-a-29-shoreditch-heights',
        name: '2B N1 A - 29 Shoreditch Heights',
        address: '29 Shoreditch Heights, London',
        city: 'London',
        country: 'UK',
        images: [
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&h=600&fit=crop'
        ],
        description: 'A stunning 2-bedroom apartment in the heart of Shoreditch, featuring modern amenities and stylish decor. Perfect for business travelers and tourists exploring London\'s vibrant East End.',
        houseRules: [
          'No smoking inside the property',
          'No pets allowed',
          'Check-in after 3:00 PM',
          'Check-out before 11:00 AM',
          'No parties or events',
          'Quiet hours after 10:00 PM'
        ],
        price: {
          perNight: 180,
          currency: 'GBP'
        },
        averageRating: 0,
        totalReviews: 0,
        approvedReviews: 0
      },
      {
        id: 'luxury-loft-manhattan',
        name: 'Luxury Loft in Manhattan',
        address: '123 Broadway, New York',
        city: 'New York',
        country: 'USA',
        images: [
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&h=600&fit=crop'
        ],
        description: 'Experience the ultimate Manhattan lifestyle in this luxurious loft with floor-to-ceiling windows, high-end finishes, and breathtaking city views. Ideal for discerning guests seeking comfort and sophistication.',
        houseRules: [
          'No smoking anywhere on the property',
          'Pets considered with prior approval',
          'Check-in after 4:00 PM',
          'Check-out before 12:00 PM',
          'Maximum 4 guests',
          'No loud music after 9:00 PM'
        ],
        price: {
          perNight: 450,
          currency: 'USD'
        },
        averageRating: 0,
        totalReviews: 0,
        approvedReviews: 0
      },
      {
        id: 'modern-studio-brooklyn',
        name: 'Modern Studio in Brooklyn',
        address: '456 Park Ave, Brooklyn',
        city: 'Brooklyn',
        country: 'USA',
        images: [
          'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&h=600&fit=crop'
        ],
        description: 'Chic and contemporary studio apartment in trendy Brooklyn, featuring smart home technology and designer furniture. Perfect for solo travelers or couples exploring NYC\'s cultural scene.',
        houseRules: [
          'No smoking',
          'No pets',
          'Check-in after 2:00 PM',
          'Check-out before 10:00 AM',
          'Maximum 2 guests',
          'Respect building quiet hours'
        ],
        price: {
          perNight: 220,
          currency: 'USD'
        },
        averageRating: 0,
        totalReviews: 0,
        approvedReviews: 0
      },
      {
        id: 'cozy-apartment-queens',
        name: 'Cozy Apartment in Queens',
        address: '789 Main St, Queens',
        city: 'Queens',
        country: 'USA',
        images: [
          'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'
        ],
        description: 'A warm and inviting apartment in Queens offering comfort and convenience. Close to public transportation and local attractions, perfect for budget-conscious travelers who want to explore NYC.',
        houseRules: [
          'No smoking inside',
          'Pets welcome with deposit',
          'Check-in after 3:00 PM',
          'Check-out before 11:00 AM',
          'Maximum 3 guests',
          'Keep noise levels reasonable'
        ],
        price: {
          perNight: 150,
          currency: 'USD'
        },
        averageRating: 0,
        totalReviews: 0,
        approvedReviews: 0
      },
      {
        id: 'penthouse-city-views',
        name: 'Penthouse with City Views',
        address: '321 High Rise, Manhattan',
        city: 'Manhattan',
        country: 'USA',
        images: [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&h=600&fit=crop'
        ],
        description: 'Ultra-luxurious penthouse with panoramic city views, premium amenities, and exclusive access to building facilities. The ultimate Manhattan experience for those who demand the finest accommodations.',
        houseRules: [
          'No smoking anywhere on premises',
          'No pets allowed',
          'Check-in after 5:00 PM',
          'Check-out before 12:00 PM',
          'Maximum 6 guests',
          'Formal attire required in common areas',
          'No parties or events without approval'
        ],
        price: {
          perNight: 850,
          currency: 'USD'
        },
        averageRating: 0,
        totalReviews: 0,
        approvedReviews: 0
      }
    ];
  }
}
