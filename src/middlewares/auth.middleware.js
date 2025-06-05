import jwtService from '../services/jwt.service';

/**
 * Authentication middleware to protect routes.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer TOKEN"

  if (token == null) {
    return res.sendStatus(401); // If there's no token, return 401 Unauthorized
  }

  const user = jwtService.verifyToken(token);

  if (!user) {
    return res.sendStatus(403); // If token is not valid, return 403 Forbidden
  }

  req.user = user; // Attach user payload to the request object
  next(); // Proceed to the next middleware or route handler
};

export default {
  authenticate,
};
