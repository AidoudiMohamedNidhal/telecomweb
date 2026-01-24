const express = require('express');
const Ticket = require('../src-models/Ticket');
const TicketUpdate = require('../src-models/TicketUpdate');
const User = require('../src-models/User');
const { 
  requireStaff, 
  requireAgentOrAdmin, 
  requireAdmin,
  canAccessTicket 
} = require('../src-middleware/auth');
const { 
  validate, 
  createTicketSchema, 
  updateTicketSchema, 
  ticketFilterSchema, 
  ticketUpdateSchema,
  assignTicketSchema 
} = require('../src-utils/validation');
const { emitToUser, emitToRole, emitToTicket } = require('../src-utils/socket');

const router = express.Router();

// Get all tickets (with filters)
router.get('/', validate(ticketFilterSchema, 'query'), async (req, res) => {
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
      limit, 
      offset 
    } = req.query;

    let filters = {
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

    // Clients can only see their own tickets
    if (req.user.role === 'CLIENT') {
      filters.createdById = req.user.id;
    }

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
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'Failed to get tickets' });
  }
});

// Get single ticket by ID
router.get('/:id', canAccessTicket, async (req, res) => {
  try {
    const ticket = req.ticket;
    const updates = await Ticket.getUpdates(ticket.id);

    res.json({
      ticket,
      updates
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ error: 'Failed to get ticket' });
  }
});

// Get single ticket by code
router.get('/code/:code', canAccessTicket, async (req, res) => {
  try {
    const { code } = req.params;
    const ticket = await Ticket.findByCode(code);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check access permissions
    if (req.user.role === 'CLIENT' && ticket.created_by_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied - you can only view your own tickets' });
    }

    const updates = await Ticket.getUpdates(ticket.id);

    res.json({
      ticket,
      updates
    });
  } catch (error) {
    console.error('Get ticket by code error:', error);
    res.status(500).json({ error: 'Failed to get ticket' });
  }
});

// Create new ticket
router.post('/', validate(createTicketSchema), async (req, res) => {
  try {
    const { subject, description, category, priority, region, contactPhone } = req.body;

    const ticketData = {
      subject,
      description,
      category,
      priority,
      region,
      contactPhone,
      createdById: req.user.id
    };

    const ticket = await Ticket.create(ticketData);

    // Notify staff about new ticket
    emitToRole('AGENT', 'ticketCreated', {
      ticket: {
        id: ticket.id,
        code: ticket.code,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        created_at: ticket.created_at
      },
      createdBy: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
      }
    });

    emitToRole('ADMIN', 'ticketCreated', {
      ticket: {
        id: ticket.id,
        code: ticket.code,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        created_at: ticket.created_at
      },
      createdBy: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
      }
    });

    res.status(201).json({
      message: 'Ticket created successfully',
      ticket
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// Update ticket (staff only)
router.put('/:id', 
  requireStaff, 
  canAccessTicket, 
  validate(updateTicketSchema), 
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const oldTicket = await Ticket.findById(id);
      const updatedTicket = await Ticket.update(parseInt(id), updateData);

      // Add update record
      await Ticket.addUpdate(id, req.user.id, 'Ticket details updated', oldTicket.status, updatedTicket.status);

      // Notify relevant users
      emitToTicket(id, 'ticketUpdated', {
        ticket: updatedTicket,
        updatedBy: {
          id: req.user.id,
          name: req.user.name,
          role: req.user.role
        }
      });

      // Notify ticket creator
      emitToUser(updatedTicket.created_by_id, 'ticketUpdated', {
        ticket: updatedTicket,
        updatedBy: {
          id: req.user.id,
          name: req.user.name,
          role: req.user.role
        }
      });

      res.json({
        message: 'Ticket updated successfully',
        ticket: updatedTicket
      });
    } catch (error) {
      console.error('Update ticket error:', error);
      res.status(500).json({ error: 'Failed to update ticket' });
    }
  }
);

// Update ticket status
router.patch('/:id/status', 
  requireStaff, 
  canAccessTicket, 
  validate(ticketUpdateSchema), 
  async (req, res) => {
    try {
      const { id } = req.params;
      const { newStatus, note } = req.body;

      const updatedTicket = await Ticket.updateStatus(parseInt(id), newStatus, req.user.id);

      // Add update record with note
      if (note) {
        await Ticket.addUpdate(parseInt(id), req.user.id, note, null, newStatus);
      }

      // Notify relevant users
      emitToTicket(id, 'ticketStatusChanged', {
        ticket: updatedTicket,
        newStatus,
        updatedBy: {
          id: req.user.id,
          name: req.user.name,
          role: req.user.role
        }
      });

      // Notify ticket creator
      emitToUser(updatedTicket.created_by_id, 'ticketStatusChanged', {
        ticket: {
          id: updatedTicket.id,
          code: updatedTicket.code,
          subject: updatedTicket.subject,
          status: updatedTicket.status
        },
        newStatus,
        updatedBy: {
          id: req.user.id,
          name: req.user.name,
          role: req.user.role
        }
      });

      // Notify assigned technician
      if (updatedTicket.assigned_to_id) {
        emitToUser(updatedTicket.assigned_to_id, 'ticketStatusChanged', {
          ticket: {
            id: updatedTicket.id,
            code: updatedTicket.code,
            subject: updatedTicket.subject,
            status: updatedTicket.status
          },
          newStatus,
          updatedBy: {
            id: req.user.id,
            name: req.user.name,
            role: req.user.role
          }
        });
      }

      res.json({
        message: 'Ticket status updated successfully',
        ticket: updatedTicket
      });
    } catch (error) {
      console.error('Update ticket status error:', error);
      res.status(500).json({ error: 'Failed to update ticket status' });
    }
  }
);

// Assign ticket to staff member
router.patch('/:id/assign', 
  requireAgentOrAdmin, 
  canAccessTicket, 
  validate(assignTicketSchema), 
  async (req, res) => {
    try {
      const { id } = req.params;
      const { assignedToId } = req.body;

      // Verify assigned user exists and is staff
      const assignedUser = await User.findById(assignedToId);
      if (!assignedUser || !['AGENT', 'TECH', 'ADMIN'].includes(assignedUser.role)) {
        return res.status(400).json({ error: 'Invalid assignment - user not found or not staff' });
      }

      const updatedTicket = await Ticket.assign(parseInt(id), assignedToId, req.user.id);

      // Notify assigned user
      emitToUser(assignedToId, 'ticketAssigned', {
        ticket: updatedTicket,
        assignedBy: {
          id: req.user.id,
          name: req.user.name,
          role: req.user.role
        }
      });

      // Notify ticket creator
      emitToUser(updatedTicket.created_by_id, 'ticketAssigned', {
        ticket: {
          id: updatedTicket.id,
          code: updatedTicket.code,
          subject: updatedTicket.subject,
          status: updatedTicket.status
        },
        assignedTo: {
          id: assignedUser.id,
          name: assignedUser.name,
          role: assignedUser.role
        }
      });

      res.json({
        message: 'Ticket assigned successfully',
        ticket: updatedTicket
      });
    } catch (error) {
      console.error('Assign ticket error:', error);
      res.status(500).json({ error: 'Failed to assign ticket' });
    }
  }
);

// Resolve ticket
router.put('/:id/resolve', 
  requireAdmin, 
  canAccessTicket, 
  async (req, res) => {
    try {
      const { id } = req.params;
      console.log('Resolving ticket:', id);
      
      const updatedTicket = await Ticket.updateStatus(parseInt(id), 'RESOLVED', req.user.id);
      console.log('Ticket updated:', updatedTicket);

      // Notify ticket creator (only if socket is available)
      try {
        emitToUser(updatedTicket.created_by_id, 'ticketResolved', {
          ticket: updatedTicket,
          resolvedBy: {
            id: req.user.id,
            name: req.user.name
          }
        });
      } catch (socketError) {
        console.log('Socket notification failed (non-critical):', socketError.message);
      }

      res.json({
        message: 'Ticket resolved successfully',
        ticket: updatedTicket
      });
    } catch (error) {
      console.error('Resolve ticket error:', error);
      res.status(500).json({ error: 'Failed to resolve ticket: ' + error.message });
    }
  }
);

// Close ticket
router.put('/:id/close', 
  requireAdmin, 
  canAccessTicket, 
  async (req, res) => {
    try {
      const { id } = req.params;
      console.log('Closing ticket:', id);
      
      const updatedTicket = await Ticket.updateStatus(parseInt(id), 'CLOSED', req.user.id);
      console.log('Ticket closed:', updatedTicket);

      // Notify ticket creator (only if socket is available)
      try {
        emitToUser(updatedTicket.created_by_id, 'ticketClosed', {
          ticket: updatedTicket,
          closedBy: {
            id: req.user.id,
            name: req.user.name
          }
        });
      } catch (socketError) {
        console.log('Socket notification failed (non-critical):', socketError.message);
      }

      res.json({
        message: 'Ticket closed successfully',
        ticket: updatedTicket
      });
    } catch (error) {
      console.error('Close ticket error:', error);
      res.status(500).json({ error: 'Failed to close ticket: ' + error.message });
    }
  }
);

// Add comment/update to ticket
router.post('/:id/updates', 
  canAccessTicket, 
  validate(ticketUpdateSchema), 
  async (req, res) => {
    try {
      const { id } = req.params;
      const { note, newStatus } = req.body;

      if (!note && !newStatus) {
        return res.status(400).json({ error: 'Either note or newStatus is required' });
      }

      // Update status if provided
      let updatedTicket = null;
      if (newStatus) {
        updatedTicket = await Ticket.updateStatus(parseInt(id), newStatus, req.user.id);
      }

      // Add update record
      const update = await Ticket.addUpdate(parseInt(id), req.user.id, note, null, newStatus);

      // Get current ticket data for notification
      const ticket = await Ticket.findById(parseInt(id));

      // Notify relevant users
      emitToTicket(id, 'ticketCommentAdded', {
        ticket,
        update: {
          ...update,
          user: {
            id: req.user.id,
            name: req.user.name,
            role: req.user.role
          }
        }
      });

      // Notify ticket creator if not the creator
      if (ticket.created_by_id !== req.user.id) {
        emitToUser(ticket.created_by_id, 'ticketCommentAdded', {
          ticket: {
            id: ticket.id,
            code: ticket.code,
            subject: ticket.subject
          },
          update: {
            ...update,
            user: {
              id: req.user.id,
              name: req.user.name,
              role: req.user.role
            }
          }
        });
      }

      // Notify assigned technician if different from commenter
      if (ticket.assigned_to_id && ticket.assigned_to_id !== req.user.id) {
        emitToUser(ticket.assigned_to_id, 'ticketCommentAdded', {
          ticket: {
            id: ticket.id,
            code: ticket.code,
            subject: ticket.subject
          },
          update: {
            ...update,
            user: {
              id: req.user.id,
              name: req.user.name,
              role: req.user.role
            }
          }
        });
      }

      res.status(201).json({
        message: 'Update added successfully',
        update,
        ticket: updatedTicket || ticket
      });
    } catch (error) {
      console.error('Add ticket update error:', error);
      res.status(500).json({ error: 'Failed to add ticket update' });
    }
  }
);

// Get ticket updates
router.get('/:id/updates', canAccessTicket, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = await Ticket.getUpdates(parseInt(id));

    res.json({ updates });
  } catch (error) {
    console.error('Get ticket updates error:', error);
    res.status(500).json({ error: 'Failed to get ticket updates' });
  }
});

// Delete ticket (admin only)
router.delete('/:id', 
  requireAdmin, 
  canAccessTicket, 
  async (req, res) => {
    try {
      const { id } = req.params;
      const ticketId = parseInt(id);
      
      if (isNaN(ticketId)) {
        return res.status(400).json({ error: 'Invalid ticket ID' });
      }
      
      // Check if ticket exists
      const ticket = await Ticket.findById(ticketId);
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      
      // Delete the ticket
      await Ticket.delete(ticketId);
      
      // Try to notify ticket creator (non-critical)
      try {
        emitToUser(ticket.created_by_id, 'ticketDeleted', {
          ticket: ticket,
          deletedBy: {
            id: req.user.id,
            name: req.user.name
          }
        });
      } catch (socketError) {
        console.log('Socket notification failed (non-critical):', socketError.message);
      }

      res.json({
        message: 'Ticket deleted successfully',
        ticket: ticket
      });
    } catch (error) {
      console.error('Delete ticket error:', error);
      res.status(500).json({ error: 'Failed to delete ticket: ' + error.message });
    }
  }
);

module.exports = router;
