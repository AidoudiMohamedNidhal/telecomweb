const { query } = require('../src-database/connection');

class TicketUpdate {
  static async create(updateData) {
    const { ticketId, userId, note, oldStatus, newStatus } = updateData;
    
    const sql = `
      INSERT INTO ticket_updates (ticket_id, user_id, note, old_status, new_status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await query(sql, [ticketId, userId, note, oldStatus, newStatus]);
    return result.rows[0];
  }

  static async findByTicketId(ticketId) {
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

  static async findById(id) {
    const sql = `
      SELECT tu.*, u.name, u.email, u.role
      FROM ticket_updates tu
      JOIN users u ON tu.user_id = u.id
      WHERE tu.id = $1
    `;
    
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async delete(id) {
    const sql = 'DELETE FROM ticket_updates WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rowCount > 0;
  }

  static async getRecentUpdates(limit = 50, userId = null) {
    let sql = `
      SELECT tu.*, t.code as ticket_code, t.subject as ticket_subject,
             u.name as user_name, u.email as user_email, u.role as user_role
      FROM ticket_updates tu
      JOIN tickets t ON tu.ticket_id = t.id
      JOIN users u ON tu.user_id = u.id
    `;
    const params = [];

    if (userId) {
      sql += ' WHERE tu.user_id = $1';
      params.push(userId);
    }

    sql += ' ORDER BY tu.created_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const result = await query(sql, params);
    return result.rows;
  }
}

module.exports = TicketUpdate;
