# Flex Living Reviews Dashboard - Backend

A comprehensive backend API for managing property reviews and analytics for Flex Living.

## Tech Stack

- **Node.js** with **Express.js**
- **TypeScript** for type safety
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Axios** for external API calls
- **CORS** for cross-origin requests
- **Helmet** for security
- **Morgan** for logging

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin/Manager)
- Secure password hashing with bcryptjs
- Protected routes for manager dashboard

### 📊 Review Management
- Hostaway API integration with mock data
- Google Places API integration (exploratory)
- Review normalization and categorization
- Review approval/rejection workflow
- Advanced filtering and search capabilities

### 📈 Analytics & Dashboard
- Comprehensive dashboard statistics
- Property performance metrics
- Rating distribution analysis
- Recent reviews tracking
- Top-performing properties

### 🏠 Property Management
- Property listing and details
- Review aggregation per property
- Property performance tracking

## API Endpoints

### Authentication
- `POST /api/auth/login` - Manager login
- `POST /api/auth/register` - Manager registration
- `GET /api/auth/profile` - Get user profile

### Reviews
- `GET /api/reviews` - Get all reviews with filters
- `GET /api/reviews/approved` - Get approved reviews for public display
- `PATCH /api/reviews/:id/approve` - Approve a review
- `PATCH /api/reviews/:id/reject` - Reject a review
- `GET /api/reviews/dashboard-stats` - Get dashboard statistics
- `GET /api/reviews/properties` - Get all properties

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   HOSTAWAY_API_KEY=f94377ebbbb479490bb3ec364649168dc443dda2e4830facaf5de2e74ccc9152
   HOSTAWAY_ACCOUNT_ID=61148
   GOOGLE_PLACES_API_KEY=your-google-places-api-key
   NODE_ENV=development
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## Demo Credentials

- **Admin**: admin@flexliving.com / admin123
- **Manager**: manager@flexliving.com / admin123

## API Integration

### Hostaway Integration
- Fetches reviews from Hostaway API
- Normalizes review data structure
- Handles API errors gracefully with mock data fallback
- Supports filtering by property, rating, category, and date

### Google Places Integration
- Exploratory integration with Google Places API
- Fetches place details and reviews
- Normalizes Google review data to match internal structure
- Includes mock data for development and testing

## Data Models

### Review Categories
- Cleanliness (1-10)
- Communication (1-10)
- Respect House Rules (1-10)
- Check-in (1-10)
- Value (1-10)
- Location (1-10)

### Review Channels
- Hostaway
- Google
- Airbnb
- Booking.com

## Error Handling

- Comprehensive error handling with appropriate HTTP status codes
- Detailed error messages for debugging
- Graceful fallback to mock data when external APIs fail
- Input validation and sanitization

## Security Features

- JWT token authentication
- Password hashing with bcryptjs
- CORS configuration
- Helmet security headers
- Input validation and sanitization
- Rate limiting (can be added)

## Performance Optimizations

- Efficient data normalization
- Optimized database queries (when implemented)
- Caching strategies for frequently accessed data
- Pagination support for large datasets

## Development Notes

- All external API calls include proper error handling
- Mock data is provided for development and testing
- TypeScript ensures type safety throughout the application
- Modular architecture for easy maintenance and scaling
