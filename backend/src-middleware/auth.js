const jwt = require('jsonwebtoken');
const User = require('../src-models/User');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token - user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

const requireAdmin = requireRole(['ADMIN']);
const requireAgentOrAdmin = requireRole(['AGENT', 'ADMIN']);
const requireTechOrAdmin = requireRole(['TECH', 'ADMIN']);
const requireStaff = requireRole(['AGENT', 'TECH', 'ADMIN']);

// Check if user can access a specific ticket
const canAccessTicket = async (req, res, next) => {
  try {
    const Ticket = require('../src-models/Ticket');
    const ticketId = req.params.id || req.params.ticketId;
    
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Client can only access their own tickets
    if (req.user.role === 'CLIENT' && ticket.created_by_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied - you can only view your own tickets' });
    }

    // Staff can access all tickets
    req.ticket = ticket;
    next();
  } catch (error) {
    console.error('Ticket access check error:', error);
    return res.status(500).json({ error: 'Error checking ticket access' });
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireAgentOrAdmin,
  requireTechOrAdmin,
  requireStaff,
  canAccessTicket
};
