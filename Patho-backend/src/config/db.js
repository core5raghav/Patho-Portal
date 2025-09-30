const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'Accuster',
  password: process.env.DB_PASSWORD?.replace(/^['"]|['"]$/g, '') || '', // Remove surrounding quotes
  database: process.env.DB_NAME || 'accusterpatho',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  // Valid MySQL2 connection pool options only
  connectTimeout: 60000,
  idleTimeout: 600000
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test connection function
const testConnection = async () => {
  try {
    console.log('🔄 Testing database connection...');
    console.log(`Connecting to: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`Database: ${dbConfig.database}`);
    console.log(`User: ${dbConfig.user}`);
    
    const connection = await pool.getConnection();
    console.log(`✅ MySQL Connected successfully to database: ${dbConfig.database}`);
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Database query test successful');
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('SQL State:', error.sqlState);
    
    // Don't exit the process, just log the error
    console.error('⚠️  Server will continue but database operations will fail');
    return false;
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Closing database connections...');
  await pool.end();
  console.log('✅ Database connections closed');
  process.exit(0);
});

module.exports = {
  pool,
  testConnection,
  dbConfig
};