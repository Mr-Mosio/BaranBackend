import express from 'express';
import helmet from 'helmet';
import authMiddleware from './middlewares/auth.middleware.js';
import authRoutes from './api/v1/auth/auth.routes.js';
import responseMiddleware from './middlewares/response.middleware.js';

const app = express();

// Apply security middlewares
app.use(helmet());

// Parse JSON request bodies
app.use(express.json());

// Standardize API responses
app.use(responseMiddleware);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('English Learning Platform API is running!');
});

// Example of a protected route
app.get('/protected', authMiddleware.authenticate, (req, res) => {
  res.send(`This is a protected route. Welcome, user with ID: ${req.user.id}`);
});

// Mount authentication routes
app.use('/api/v1/auth', authRoutes);

// TODO: Add more routes and error handling

export default app;
