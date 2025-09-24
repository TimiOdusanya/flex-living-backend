import fs from 'fs';
import path from 'path';
import { NormalizedReview } from '../types';

interface ReviewState {
  id: number;
  isApproved: boolean;
  lastUpdated: string;
}

interface StorageData {
  reviews: ReviewState[];
  lastSync: string;
}

interface ReviewsStorageData {
  reviews: NormalizedReview[];
  lastSync: string;
}

const STORAGE_FILE = path.join(process.cwd(), 'data', 'review-states.json');
const REVIEWS_FILE = path.join(process.cwd(), 'data', 'reviews.json');

// Ensure data directory exists
const ensureDataDirectory = () => {
  const dataDir = path.dirname(STORAGE_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Load review states from file
export const loadReviewStates = (): ReviewState[] => {
  try {
    ensureDataDirectory();
    if (!fs.existsSync(STORAGE_FILE)) {
      return [];
    }
    
    const data = fs.readFileSync(STORAGE_FILE, 'utf8');
    const parsed: StorageData = JSON.parse(data);
    return parsed.reviews || [];
  } catch (error) {
    console.error('Error loading review states:', error);
    return [];
  }
};

// Save review states to file
export const saveReviewStates = (reviews: ReviewState[]): void => {
  try {
    ensureDataDirectory();
    const data: StorageData = {
      reviews,
      lastSync: new Date().toISOString()
    };
    
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving review states:', error);
  }
};

// Get approval status for a review
export const getReviewApprovalStatus = (reviewId: number): boolean => {
  const states = loadReviewStates();
  const state = states.find(s => s.id === reviewId);
  return state?.isApproved ?? false; // Default to false if not found
};

// Set approval status for a review
export const setReviewApprovalStatus = (reviewId: number, isApproved: boolean): void => {
  const states = loadReviewStates();
  const existingIndex = states.findIndex(s => s.id === reviewId);
  
  const newState: ReviewState = {
    id: reviewId,
    isApproved,
    lastUpdated: new Date().toISOString()
  };
  
  if (existingIndex >= 0) {
    states[existingIndex] = newState;
  } else {
    states.push(newState);
  }
  
  saveReviewStates(states);
};

// Get all approved review IDs
export const getApprovedReviewIds = (): number[] => {
  const states = loadReviewStates();
  return states.filter(s => s.isApproved).map(s => s.id);
};

// Get all pending review IDs
export const getPendingReviewIds = (): number[] => {
  const states = loadReviewStates();
  return states.filter(s => !s.isApproved).map(s => s.id);
};

// StorageManager class for managing reviews and approvals
export class StorageManager {
  static initialize(): void {
    ensureDataDirectory();
  }

  static getReviews(): NormalizedReview[] {
    try {
      if (!fs.existsSync(REVIEWS_FILE)) {
        return [];
      }
      
      const data = fs.readFileSync(REVIEWS_FILE, 'utf8');
      const parsed: ReviewsStorageData = JSON.parse(data);
      const reviews = parsed.reviews || [];
      
      // Convert submittedAt strings back to Date objects
      return reviews.map(review => ({
        ...review,
        submittedAt: new Date(review.submittedAt)
      }));
    } catch (error) {
      console.error('Error loading reviews from storage:', error);
      return [];
    }
  }

  static setReviews(reviews: NormalizedReview[]): void {
    try {
      ensureDataDirectory();
      const data: ReviewsStorageData = {
        reviews,
        lastSync: new Date().toISOString()
      };
      
      fs.writeFileSync(REVIEWS_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving reviews to storage:', error);
    }
  }

  static getApprovalStatus(reviewId: number): 'approved' | 'rejected' | 'pending' {
    const states = loadReviewStates();
    const state = states.find(s => s.id === reviewId);
    if (!state) return 'pending';
    return state.isApproved ? 'approved' : 'rejected';
  }

  static getAllApprovals(): ReviewState[] {
    return loadReviewStates();
  }

  static approveReview(reviewId: number): void {
    setReviewApprovalStatus(reviewId, true);
  }

  static rejectReview(reviewId: number): void {
    setReviewApprovalStatus(reviewId, false);
  }
}
