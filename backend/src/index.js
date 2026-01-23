const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('../src-routes/auth');
const ticketRoutes = require('../src-routes/tickets');
const adminRoutes = require('../src-routes/admin');
const { authenticateToken } = require('../src-middleware/auth');
const { initSocket } = require('../src-utils/socket');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:4200",
    methods: ["GET", "POST"]
  }
});

// Middleware
// app.use(helmet({
//   contentSecurityPolicy: false,
//   crossOriginEmbedderPolicy: false
// }));
app.use(cors({
  origin: ["http://localhost:4200", "http://127.0.0.1:4200"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', authenticateToken, ticketRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Initialize Socket.IO
initSocket(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

module.exports = { app, server, io };
