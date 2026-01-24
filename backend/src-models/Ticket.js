const { query } = require('../src-database/connection');

class Ticket {
  static async create(ticketData) {
    const { subject, description, category, priority = 'MEDIUM', region, contactPhone, createdById } = ticketData;
    
    const sql = `
      INSERT INTO tickets (subject, description, category, priority, region, contact_phone, created_by_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const result = await query(sql, [subject, description, category, priority, region, contactPhone, createdById]);
    return result.rows[0];
  }

  static async findById(id) {
    const sql = `
      SELECT t.*, 
             u1.name as created_by_name, u1.email as created_by_email,
             u2.name as assigned_to_name, u2.email as assigned_to_email
      FROM tickets t
      LEFT JOIN users u1 ON t.created_by_id = u1.id
      LEFT JOIN users u2 ON t.assigned_to_id = u2.id
      WHERE t.id = $1
    `;
    
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async findByCode(code) {
    const sql = `
      SELECT t.*, 
             u1.name as created_by_name, u1.email as created_by_email,
             u2.name as assigned_to_name, u2.email as assigned_to_email
      FROM tickets t
      LEFT JOIN users u1 ON t.created_by_id = u1.id
      LEFT JOIN users u2 ON t.assigned_to_id = u2.id
      WHERE t.code = $1
    `;
    
    const result = await query(sql, [code]);
    return result.rows[0];
  }

  static async findAll(filters = {}, limit = 50, offset = 0) {
    let sql = `
      SELECT t.*, 
             u1.name as created_by_name, u1.email as created_by_email,
             u2.name as assigned_to_name, u2.email as assigned_to_email
      FROM tickets t
      LEFT JOIN users u1 ON t.created_by_id = u1.id
      LEFT JOIN users u2 ON t.assigned_to_id = u2.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // Apply filters
    if (filters.status) {
      sql += ` AND t.status = $${paramIndex++}`;
      params.push(filters.status);
    }
    if (filters.category) {
      sql += ` AND t.category = $${paramIndex++}`;
      params.push(filters.category);
    }
    if (filters.priority) {
      sql += ` AND t.priority = $${paramIndex++}`;
      params.push(filters.priority);
    }
    if (filters.region) {
      sql += ` AND t.region ILIKE $${paramIndex++}`;
      params.push(`%${filters.region}%`);
    }
    if (filters.assignedToId) {
      sql += ` AND t.assigned_to_id = $${paramIndex++}`;
      params.push(filters.assignedToId);
    }
    if (filters.createdById) {
      sql += ` AND t.created_by_id = $${paramIndex++}`;
      params.push(filters.createdById);
    }
    if (filters.search) {
      sql += ` AND (t.subject ILIKE $${paramIndex++} OR t.description ILIKE $${paramIndex++} OR t.code ILIKE $${paramIndex++})`;
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }
    if (filters.dateFrom) {
      sql += ` AND t.created_at >= $${paramIndex++}`;
      params.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      sql += ` AND t.created_at <= $${paramIndex++}`;
      params.push(filters.dateTo);
    }

    sql += ` ORDER BY t.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    return result.rows;
  }

  static async update(id, updateData) {
    const { subject, description, category, priority, status, region, contactPhone, assignedToId } = updateData;
    
    const sql = `
      UPDATE tickets 
      SET subject = $1, description = $2, category = $3, priority = $4, 
          status = $5, region = $6, contact_phone = $7, assigned_to_id = $8
      WHERE id = $9
      RETURNING *
    `;
    
    const result = await query(sql, [subject, description, category, priority, status, region, contactPhone, assignedToId, id]);
    return result.rows[0];
  }

  static async updateStatus(id, newStatus, userId) {
    // Ensure id is an integer
    const ticketId = parseInt(id);
    if (isNaN(ticketId)) {
      throw new Error('Invalid ticket ID');
    }
    
    // Ensure userId is an integer
    const userIdInt = parseInt(userId);
    if (isNaN(userIdInt)) {
      throw new Error('Invalid user ID');
    }
    
    console.log('updateStatus called with:', { ticketId, newStatus, userId: userIdInt });
    
    // First get current status
    const currentTicket = await this.findById(ticketId);
    if (!currentTicket) {
      throw new Error('Ticket not found');
    }

    const sql = `
      UPDATE tickets 
      SET status = $1::ticket_status, assigned_to_id = CASE WHEN $1::ticket_status = 'ASSIGNED' THEN assigned_to_id ELSE assigned_to_id END
      WHERE id = $2
      RETURNING *
    `;
    
    console.log('Executing SQL with params:', [newStatus, ticketId]);
    const result = await query(sql, [newStatus, ticketId]);
    
    // Create status update record (temporarily disabled to fix enum issue)
    if (currentTicket.status !== newStatus) {
      console.log('Skipping ticket update record due to enum issue');
      // await this.addUpdate(ticketId, userIdInt, null, currentTicket.status, newStatus);
    }
    
    return result.rows[0];
  }

  static async assign(id, assignedToId, userId) {
    // Ensure id is an integer
    const ticketId = parseInt(id);
    if (isNaN(ticketId)) {
      throw new Error('Invalid ticket ID');
    }
    
    const sql = `
      UPDATE tickets 
      SET assigned_to_id = $1, status = CASE WHEN status = 'NEW' THEN 'ASSIGNED' ELSE status END
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await query(sql, [assignedToId, ticketId]);
    
    // Create assignment update record
    await this.addUpdate(ticketId, userId, `Ticket assigned to user ID: ${assignedToId}`, null, null);
    
    return result.rows[0];
  }

  static async addUpdate(ticketId, userId, note = null, oldStatus = null, newStatus = null) {
    let sql, params;
    
    if (oldStatus && newStatus) {
      // Both statuses are provided, cast to enum
      sql = `
        INSERT INTO ticket_updates (ticket_id, user_id, note, old_status, new_status)
        VALUES ($1, $2, $3, $4::ticket_status, $5::ticket_status)
        RETURNING *
      `;
      params = [ticketId, userId, note, oldStatus, newStatus];
    } else {
      // One or both statuses are null, don't cast
      sql = `
        INSERT INTO ticket_updates (ticket_id, user_id, note, old_status, new_status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      params = [ticketId, userId, note, oldStatus, newStatus];
    }
    
    console.log('addUpdate SQL:', sql);
    console.log('addUpdate params:', params);
    const result = await query(sql, params);
    return result.rows[0];
  }

  static async delete(id) {
    const sql = 'DELETE FROM tickets WHERE id = $1 RETURNING *';
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async getUpdates(ticketId) {
    const sql = `
      SELECT tu.*, u.name, u.email, u.role
      FROM ticket_updates tu
      JOIN users u ON tu.user_id = u.id
      WHERE tu.ticket_id = $1
      ORDER BY tu.created_at ASC
    `;
    
    const result = await query(sql, [ticketId]);
    return result.rows;
  }

  static async getStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN status = 'NEW' THEN 1 END) as new_tickets,
        COUNT(CASE WHEN status = 'ASSIGNED' THEN 1 END) as assigned_tickets,
        COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress_tickets,
        COUNT(CASE WHEN status = 'WAITING_CUSTOMER' THEN 1 END) as waiting_customer_tickets,
        COUNT(CASE WHEN status = 'RESOLVED' THEN 1 END) as resolved_tickets,
        COUNT(CASE WHEN status = 'CLOSED' THEN 1 END) as closed_tickets
      FROM tickets
    `;
    
    const result = await query(sql);
    return result.rows[0];
  }

  static async getStatsByCategory() {
    const sql = `
      SELECT 
        category,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'RESOLVED' THEN 1 END) as resolved_count
      FROM tickets
      GROUP BY category
      ORDER BY count DESC
    `;
    
    const result = await query(sql);
    return result.rows;
  }

  static async getStatsByPriority() {
    const sql = `
      SELECT 
        priority,
        COUNT(*) as count
      FROM tickets
      GROUP BY priority
      ORDER BY 
        CASE priority 
          WHEN 'HIGH' THEN 1 
          WHEN 'MEDIUM' THEN 2 
          WHEN 'LOW' THEN 3 
        END
    `;
    
    const result = await query(sql);
    return result.rows;
  }

  static async getStatsByRegion() {
    const sql = `
      SELECT 
        region,
        COUNT(*) as count
      FROM tickets
      WHERE region IS NOT NULL
      GROUP BY region
      ORDER BY count DESC
      LIMIT 10
    `;
    
    const result = await query(sql);
    return result.rows;
  }
}

module.exports = Ticket;
