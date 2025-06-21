import express from 'express';
import helmet from 'helmet';
import authMiddleware from './middlewares/auth.middleware.js';
import authRoutes from './api/v1/auth/auth.routes.js';
import responseMiddleware from './middlewares/response.middleware.js';
import i18nMiddleware from './middlewares/i18n.middleware.js';
import prisma from './services/prisma.service.js';

const app = express();

// Apply security middlewares
app.use(helmet());

// Parse JSON request bodies
app.use(express.json());

// Standardize API responses
app.use(responseMiddleware);

app.use(i18nMiddleware);

// Basic route for testing
app.get('/', async (req, res) => {

  const paths = await prisma.learningPath.findMany({
    select: {
      id: true,
      target: {
        ONLINE_SESSION: {
          id: true,
          start_time: true,
        },
        PLACEMENT: {
          id: true
        }
      },
    }
  });

  res.success(paths);
});

// Example of a protected route
app.get('/protected', authMiddleware.authenticate, (req, res) => {
  res.send(`This is a protected route. Welcome, entry with ID: ${req.entry.id}`);
});

// Mount authentication routes
app.use('/api/v1/auth', authRoutes);

// TODO: Add more routes and error handling

export default app;
