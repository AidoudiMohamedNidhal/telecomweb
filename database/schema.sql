-- Telecom Ticketing System Database Schema

-- Drop tables if they exist (for development)
DROP TABLE IF EXISTS ticket_updates CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- User roles enum
CREATE TYPE user_role AS ENUM ('CLIENT', 'AGENT', 'TECH', 'ADMIN');

-- Ticket categories enum
CREATE TYPE ticket_category AS ENUM ('ADSL', 'FIBRE', 'MOBILE', 'BILLING', 'OTHER');

-- Ticket priorities enum
CREATE TYPE ticket_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- Ticket statuses enum
CREATE TYPE ticket_status AS ENUM ('NEW', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED');

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'CLIENT',
    region VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tickets table
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL, -- Format: TT-YYYYMMDD-XXXX
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category ticket_category NOT NULL,
    priority ticket_priority NOT NULL DEFAULT 'MEDIUM',
    status ticket_status NOT NULL DEFAULT 'NEW',
    region VARCHAR(50),
    contact_phone VARCHAR(20),
    created_by_id INTEGER NOT NULL REFERENCES users(id),
    assigned_to_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ticket updates table (audit trail)
CREATE TABLE ticket_updates (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    note TEXT,
    old_status ticket_status,
    new_status ticket_status,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_category ON tickets(category);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_created_by ON tickets(created_by_id);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to_id);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);
CREATE INDEX idx_ticket_updates_ticket_id ON ticket_updates(ticket_id);
CREATE INDEX idx_users_email ON users(email);

-- Function to generate ticket code
CREATE OR REPLACE FUNCTION generate_ticket_code()
RETURNS TRIGGER AS $$
DECLARE
    date_part TEXT;
    sequence_part TEXT;
BEGIN
    date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    
    -- Get the next sequence for today
    SELECT LPAD((COUNT(*) + 1)::TEXT, 4, '0')
    INTO sequence_part
    FROM tickets
    WHERE DATE(created_at) = CURRENT_DATE;
    
    NEW.code := 'TT-' || date_part || '-' || COALESCE(sequence_part, '0001');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket code
CREATE TRIGGER trigger_generate_ticket_code
    BEFORE INSERT ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION generate_ticket_code();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample admin user (password: admin123)
INSERT INTO users (name, email, password_hash, role) 
VALUES (
    'System Administrator',
    'admin@telecom.com',
    '$2a$10$rQZ8kHWKtGY5uKx4vK2qOe5qG6XfHcNpLmVjWnYqZ3rTtUuVvWwO',
    'ADMIN'
) ON CONFLICT (email) DO NOTHING;

-- Insert sample agent user (password: agent123)
INSERT INTO users (name, email, password_hash, role) 
VALUES (
    'Support Agent',
    'agent@telecom.com',
    '$2a$10$rQZ8kHWKtGY5uKx4vK2qOe5qG6XfHcNpLmVjWnYqZ3rTtUuVvWwO',
    'AGENT'
) ON CONFLICT (email) DO NOTHING;

-- Insert sample technician user (password: tech123)
INSERT INTO users (name, email, password_hash, role) 
VALUES (
    'Field Technician',
    'tech@telecom.com',
    '$2a$10$rQZ8kHWKtGY5uKx4vK2qOe5qG6XfHcNpLmVjWnYqZ3rTtUuVvWwO',
    'TECH'
) ON CONFLICT (email) DO NOTHING;

-- Insert sample client user (password: client123)
INSERT INTO users (name, email, phone, password_hash, role, region) 
VALUES (
    'John Doe',
    'client@telecom.com',
    '+21612345678',
    '$2a$10$rQZ8kHWKtGY5uKx4vK2qOe5qG6XfHcNpLmVjWnYqZ3rTtUuVvWwO',
    'CLIENT',
    'Tataouine'
) ON CONFLICT (email) DO NOTHING;
