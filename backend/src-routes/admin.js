const express = require('express');
const User = require('../src-models/User');
const Ticket = require('../src-models/Ticket');
const { requireAdmin } = require('../src-middleware/auth');
const { validate, updateUserSchema } = require('../src-utils/validation');

const router = express.Router();

// All admin routes require admin role
router.use(requireAdmin);

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const ticketStats = await Ticket.getStats();
    const categoryStats = await Ticket.getStatsByCategory();
    const priorityStats = await Ticket.getStatsByPriority();
    const regionStats = await Ticket.getStatsByRegion();
    const userStats = await User.getStats();

    res.json({
      tickets: ticketStats,
      categories: categoryStats,
      priorities: priorityStats,
      regions: regionStats,
      users: userStats
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { role, limit = 50, offset = 0 } = req.query;
    
    const users = await User.findAll(
      role, 
      parseInt(limit), 
      parseInt(offset)
    );

    res.json({
      users,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: users.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get single user
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(parseInt(id));

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update user
router.put('/users/:id', validate(updateUserSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if email is already taken by another user
    if (updateData.email) {
      const existingUser = await User.findByEmail(updateData.email);
      if (existingUser && existingUser.id !== parseInt(id)) {
        return res.status(400).json({ error: 'Email already taken by another user' });
      }
    }

    const updatedUser = await User.update(parseInt(id), updateData);

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const deleted = await User.delete(parseInt(id));

    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get all tickets (admin view - no filters applied)
router.get('/tickets', async (req, res) => {
  try {
    const { 
      status, 
      category, 
      priority, 
      region, 
      assignedToId, 
      createdById, 
      search, 
      dateFrom, 
      dateTo, 
      limit = 50, 
      offset = 0 
    } = req.query;

    const filters = {
      status,
      category,
      priority,
      region,
      assignedToId: assignedToId ? parseInt(assignedToId) : undefined,
      createdById: createdById ? parseInt(createdById) : undefined,
      search,
      dateFrom,
      dateTo
    };

    const tickets = await Ticket.findAll(filters, parseInt(limit), parseInt(offset));
    
    res.json({
      tickets,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: tickets.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get admin tickets error:', error);
    res.status(500).json({ error: 'Failed to get tickets' });
  }
});

// Get recent activity
router.get('/activity', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const TicketUpdate = require('../src-models/TicketUpdate');
    const updates = await TicketUpdate.getRecentUpdates(parseInt(limit));

    res.json({ 
      activity: updates,
      pagination: {
        limit: parseInt(limit),
        hasMore: updates.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Failed to get activity' });
  }
});

module.exports = router;
