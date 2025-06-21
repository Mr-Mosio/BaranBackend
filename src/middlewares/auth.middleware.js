import jwtService from '../services/jwt.service.js';
import prisma from '../services/prisma.service.js';
import i18n from '../utils/i18n.js';

/**
 * Authentication middleware to protect routes.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer TOKEN"

    if (token == null) {
      return res.failed(i18n.t('auth.noToken'), {}, 401);
    }

    const entry = jwtService.verifyToken(token);

    if (!entry) {
      return res.failed(i18n.t('auth.invalidToken'), {}, 403);
    }

    // Get the entry from database with roles and their permissions
    const entryData = await prisma.entity.findUnique({
      where: { id: entry.id },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!entryData) {
      return res.failed(i18n.t('auth.entryNotFound'), {}, 403);
    }

    // Format roles as array of role names
    const roles = entryData.roles.map(er => er.role.name);

    // Format permissions as object with permission names as keys
    const permissions = {};
    entryData.roles.forEach(er => {
      er.role.permissions.forEach(rp => {
        permissions[rp.permission.name] = true;
      });
    });

    req.entry = {
      ...entryData,
      roles,
      permissions
    }; // Attach entry with formatted roles and permissions
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    return res.failed(i18n.t('auth.unauthorized'), {}, 403);
  }
};

export default {
  authenticate,
};
