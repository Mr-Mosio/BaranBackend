// Load environment variables from .env file
import 'dotenv/config';

export default {
  port: process.env.PORT || 3000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret', // TODO: Change this in production
  otp: {
    expiresInMinutes: parseInt(process.env.OTP_EXPIRES_IN_MINUTES || '5', 10), // Default to 5 minutes
    codeLength: parseInt(process.env.OTP_CODE_LENGTH || '6', 10), // Default to 6 digits
  },
};
