// Check if user has required role
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions. Access denied.'
      });
    }

    next();
  };
};

// Check if user can modify resource (admin or owner)
const canModifyResource = (req, res, next) => {
  const resourceUserId = parseInt(req.params.userId || req.body.userId);
  
  if (req.user.role === 'admin' || req.user.id === resourceUserId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'You can only modify your own resources'
  });
};

// Block read-only users from write operations
const preventReadOnly = (req, res, next) => {
  if (req.user.role === 'read-only') {
    return res.status(403).json({
      success: false,
      message: 'Read-only users cannot perform this action'
    });
  }
  next();
};

module.exports = {
  requireRole,
  canModifyResource,
  preventReadOnly
};