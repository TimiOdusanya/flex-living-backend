export interface HostawayReview {
  id: number;
  type: 'host-to-guest' | 'guest-to-host';
  status: 'published' | 'pending' | 'rejected';
  rating: number | null;
  publicReview: string;
  reviewCategory: ReviewCategory[];
  submittedAt: string;
  guestName: string;
  listingName: string;
}

export interface ReviewCategory {
  category: string;
  rating: number;
}

export interface NormalizedReview {
  id: number;
  type: 'host-to-guest' | 'guest-to-host';
  status: 'published' | 'pending' | 'rejected';
  overallRating: number;
  publicReview: string;
  categories: {
    cleanliness: number;
    communication: number;
    respect_house_rules: number;
    check_in: number;
    value: number;
    location: number;
  };
  submittedAt: Date;
  guestName: string;
  listingName: string;
  channel: 'hostaway' | 'google' | 'airbnb' | 'booking';
  isApproved: boolean;
  propertyId: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  images: string[];
  description: string;
  houseRules: string[];
  price: {
    perNight: number;
    currency: string;
  };
  averageRating: number;
  totalReviews: number;
  approvedReviews: number;
}

export interface Manager {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'manager';
  createdAt: Date;
}

export interface GooglePlaceReview {
  author_name: string;
  author_url?: string;
  language: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

export interface GooglePlaceResult {
  place_id: string;
  name: string;
  rating: number;
  user_ratings_total: number;
  reviews: GooglePlaceReview[];
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export interface ReviewFilters {
  propertyId?: string;
  rating?: number;
  category?: string;
  channel?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  isApproved?: boolean;
}

export interface DashboardStats {
  totalReviews: number;
  averageRating: number;
  approvedReviews: number;
  pendingReviews: number;
  propertiesCount: number;
  recentReviews: NormalizedReview[];
  topPerformingProperties: Property[];
  ratingDistribution: { [key: number]: number };
}
