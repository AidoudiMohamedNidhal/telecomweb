require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function runMigrations() {
  let pool;
  
  try {
    console.log('🔄 Running database migrations...');
    
    // First connect to default postgres database to create our database
    const defaultPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: 'postgres',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
    });
    
    try {
      await defaultPool.query(`CREATE DATABASE "${process.env.DB_NAME || 'telecom_ticketing'}"`);
      console.log('✅ Database created successfully');
    } catch (error) {
      if (error.code === '42P04') {
        console.log('✅ Database already exists');
      } else {
        throw error;
      }
    } finally {
      await defaultPool.end();
    }
    
    // Now connect to our database
    const { pool: dbPool } = require('./connection');
    pool = dbPool;
    
    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await pool.query(schema);
    
    console.log('✅ Database migrations completed successfully');
    console.log('📊 Sample users created:');
    console.log('   Admin: admin@telecom.com / admin123');
    console.log('   Agent: agent@telecom.com / agent123');
    console.log('   Tech:  tech@telecom.com / tech123');
    console.log('   Client: client@telecom.com / client123');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
