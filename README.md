# Telecom-Style Ticketing & Helpdesk Web App

A simple support & complaints platform inspired by telecom operators for managing customer tickets efficiently.

## Features

- **Role-based Authentication**: CLIENT, AGENT, TECH, ADMIN roles
- **Ticket Management**: Create, assign, track, and resolve tickets
- **Categories**: ADSL, FIBRE, MOBILE, BILLING, OTHER
- **Workflow**: NEW → ASSIGNED → IN_PROGRESS → WAITING_CUSTOMER → RESOLVED → CLOSED
- **Real-time Notifications**: WebSocket support for live updates
- **Admin Dashboard**: Statistics and analytics
- **Search & Filters**: Advanced ticket filtering

## Tech Stack

### Frontend
- Angular (latest version)
- TypeScript
- Angular Material for UI components
- RxJS for reactive programming

### Backend
- Node.js
- Express.js
- PostgreSQL
- Socket.io for WebSocket
- JWT for authentication
- Zod for validation

## Project Structure

```
telll/
├── frontend/          # Angular application
├── backend/           # Node.js/Express API
├── database/          # Database schema and migrations
└── docs/             # Technical documentation
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- Angular CLI
- PostgreSQL
- Git

### Installation

1. Clone the repository
2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
4. Set up PostgreSQL database
5. Configure environment variables
6. Run the application

## API Endpoints

### Authentication
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login
- GET `/api/auth/profile` - Get user profile

### Tickets
- GET `/api/tickets` - List tickets (with filters)
- POST `/api/tickets` - Create new ticket
- GET `/api/tickets/:id` - Get ticket details
- PUT `/api/tickets/:id` - Update ticket
- POST `/api/tickets/:id/updates` - Add ticket update

### Admin
- GET `/api/admin/stats` - Dashboard statistics
- GET `/api/admin/users` - Manage users

## Demo Scenario

1. Client creates ticket for internet outage
2. Agent triages and assigns to technician
3. Technician works on the issue
4. Status updates are tracked in real-time
5. Ticket is resolved and closed

## Contributing

This project is designed as an educational demonstration for internship reports.
