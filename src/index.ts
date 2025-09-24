import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { ReviewService } from "./services/reviewService";
import { ReviewController } from "./controllers/reviewController";
import { AuthController } from "./controllers/authController";
import { GoogleReviewsController } from "./controllers/googleReviewsController";
import { createReviewRoutes } from "./routes/reviews";
import { createAuthRoutes } from "./routes/auth";
import { createGoogleReviewsRoutes } from "./routes/googleReviews";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;


const jwtSecret = process.env.JWT_SECRET;
const hostawayApiKey = process.env.HOSTAWAY_API_KEY;
const hostawayAccountId = process.env.HOSTAWAY_ACCOUNT_ID;
const googleApiKey = process.env.GOOGLE_PLACES_API_KEY || "";

if (process.env.NODE_ENV === "production") {
  if (!jwtSecret || !hostawayApiKey || !hostawayAccountId) {
    console.error("❌ Missing required environment variables");
    process.exit(1);
  }
}

// Middlewares
app.use(helmet());




const allowedOrigins: string[] = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://flex-living-frontend-timi.vercel.app/"
];


app.use(
  cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//  Initialize services & controllers
const reviewService = new ReviewService(
  hostawayApiKey!,
  hostawayAccountId!,
  googleApiKey
);
const reviewController = new ReviewController(reviewService);
const authController = new AuthController(jwtSecret!);

// Initialize Google Places service and controller
const { GooglePlacesService } = require('./services/googlePlacesService');
const googlePlacesService = new GooglePlacesService(googleApiKey);
const googleReviewsController = new GoogleReviewsController(googlePlacesService);

//  Routes
app.use("/api/auth", createAuthRoutes(authController));
app.use("/api/reviews", createReviewRoutes(reviewController));
app.use("/api/google", createGoogleReviewsRoutes(googleReviewsController));

app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Flex Living Reviews API is running",
    timestamp: new Date().toISOString(),
  });
});

//  404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

//  Error handler
app.use(
  (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("Unhandled Error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
);

//  Start server
app.listen(PORT, () => {
  console.log(`🚀 Flex Living Reviews API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
  console.log(`📝 Review endpoints: http://localhost:${PORT}/api/reviews`);
});

//  Handle unexpected errors (extra safety for production)
process.on("uncaughtException", (err: Error) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason: unknown, promise: Promise<any>) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
