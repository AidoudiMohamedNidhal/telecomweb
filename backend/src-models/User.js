const { query } = require('../src-database/connection');

class User {
  static async create(userData) {
    const { name, email, phone, passwordHash, role = 'CLIENT', region } = userData;
    
    const sql = `
      INSERT INTO users (name, email, phone, password_hash, role, region)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, email, phone, role, region, created_at
    `;
    
    const result = await query(sql, [name, email, phone, passwordHash, role, region]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const sql = `
      SELECT id, name, email, phone, password_hash, role, region, created_at, updated_at
      FROM users
      WHERE email = $1
    `;
    
    const result = await query(sql, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const sql = `
      SELECT id, name, email, phone, role, region, created_at, updated_at
      FROM users
      WHERE id = $1
    `;
    
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async findAll(role = null, limit = 50, offset = 0) {
    let sql = `
      SELECT id, name, email, phone, role, region, created_at, updated_at
      FROM users
    `;
    const params = [];

    if (role) {
      sql += ' WHERE role = $1';
      params.push(role);
    }

    sql += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await query(sql, params);
    return result.rows;
  }

  static async update(id, userData) {
    const { name, email, phone, role, region } = userData;
    
    const sql = `
      UPDATE users 
      SET name = $1, email = $2, phone = $3, role = $4, region = $5
      WHERE id = $6
      RETURNING id, name, email, phone, role, region, updated_at
    `;
    
    const result = await query(sql, [name, email, phone, role, region, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const sql = 'DELETE FROM users WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rowCount > 0;
  }

  static async getStats() {
    const sql = `
      SELECT 
        role,
        COUNT(*) as count
      FROM users
      GROUP BY role
      ORDER BY count DESC
    `;
    
    const result = await query(sql);
    return result.rows;
  }
}

module.exports = User;
