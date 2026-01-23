const jwt = require('jsonwebtoken');
const User = require('../src-models/User');

let io = null;

const initSocket = (socketIo) => {
  io = socketIo;

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return next(new Error('Invalid token - user not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.user.name} (${socket.user.email})`);
    
    // Join user to their personal room for notifications
    socket.join(`user_${socket.user.id}`);
    
    // Join role-based rooms
    socket.join(`role_${socket.user.role}`);
    
    // Handle joining ticket-specific rooms
    socket.on('join-ticket', (ticketId) => {
      socket.join(`ticket_${ticketId}`);
      console.log(`🎫 User ${socket.user.name} joined ticket ${ticketId}`);
    });

    // Handle leaving ticket-specific rooms
    socket.on('leave-ticket', (ticketId) => {
      socket.leave(`ticket_${ticketId}`);
      console.log(`🚪 User ${socket.user.name} left ticket ${ticketId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.user.name} (${socket.user.email})`);
    });
  });
};

// Helper functions to emit events
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
  }
};

const emitToRole = (role, event, data) => {
  if (io) {
    io.to(`role_${role}`).emit(event, data);
  }
};

const emitToTicket = (ticketId, event, data) => {
  if (io) {
    io.to(`ticket_${ticketId}`).emit(event, data);
  }
};

const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

module.exports = {
  initSocket,
  emitToUser,
  emitToRole,
  emitToTicket,
  emitToAll
};
