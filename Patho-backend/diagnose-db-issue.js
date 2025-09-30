// diagnose-db-issue.js
require('dotenv').config();
const mysql = require('mysql2/promise');
const net = require('net');

async function diagnoseConnection() {
  console.log('🔍 PathoPortal Database Connection Diagnostics');
  console.log('='.repeat(50));
  
  // 1. Check environment variables
  console.log('\n1️⃣ Environment Variables:');
  console.log(`  DB_HOST: ${process.env.DB_HOST || 'NOT SET'}`);
  console.log(`  DB_PORT: ${process.env.DB_PORT || 'NOT SET'}`);
  console.log(`  DB_USER: ${process.env.DB_USER || 'NOT SET'}`);
  console.log(`  DB_NAME: ${process.env.DB_NAME || 'NOT SET'}`);
  console.log(`  DB_PASSWORD: ${process.env.DB_PASSWORD ? '***SET***' : 'NOT SET'}`);
  
  // 2. Test network connectivity
  console.log('\n2️⃣ Network Connectivity Test:');
  await testPortConnection('127.0.0.1', 3306);
  await testPortConnection('localhost', 3306);
  
  // 3. Test different connection methods
  console.log('\n3️⃣ Database Connection Tests:');
  
  const configs = [
    {
      name: 'Standard Config',
      config: {
        host: '127.0.0.1',
        port: 3306,
        user: 'Accuster',
        password: process.env.DB_PASSWORD?.replace(/^['"]|['"]$/g, '') || '',
        database: 'accusterpatho'
      }
    },
    {
      name: 'Localhost Config',
      config: {
        host: 'localhost',
        port: 3306,
        user: 'Accuster',
        password: process.env.DB_PASSWORD?.replace(/^['"]|['"]$/g, '') || '',
        database: 'accusterpatho'
      }
    },
    {
      name: 'Without Database',
      config: {
        host: '127.0.0.1',
        port: 3306,
        user: 'Accuster',
        password: process.env.DB_PASSWORD?.replace(/^['"]|['"]$/g, '') || ''
        // No database specified
      }
    }
  ];
  
  for (const test of configs) {
    await testDatabaseConnection(test.name, test.config);
  }
  
  // 4. Provide troubleshooting suggestions
  console.log('\n4️⃣ Troubleshooting Suggestions:');
  console.log('  🔧 Common Solutions:');
  console.log('    1. Check if MySQL/Percona Server is running:');
  console.log('       Windows: Check Services or run "net start mysql"');
  console.log('       Linux: sudo systemctl status mysql');
  console.log('');
  console.log('    2. Verify MySQL is listening on port 3306:');
  console.log('       Command: netstat -an | findstr 3306');
  console.log('');
  console.log('    3. Check MySQL configuration:');
  console.log('       Look for bind-address in my.cnf/my.ini');
  console.log('       Should be 0.0.0.0 or 127.0.0.1');
  console.log('');
  console.log('    4. Test manual connection:');
  console.log('       mysql -h 127.0.0.1 -P 3306 -u Accuster -p accusterpatho');
  console.log('');
  console.log('    5. Check firewall settings');
  console.log('    6. Verify user permissions in MySQL');
}

async function testPortConnection(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = 5000;
    
    socket.setTimeout(timeout);
    
    socket.on('connect', () => {
      console.log(`  ✅ Port ${port} is open on ${host}`);
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      console.log(`  ❌ Connection to ${host}:${port} timed out`);
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', (err) => {
      console.log(`  ❌ Cannot connect to ${host}:${port} - ${err.message}`);
      resolve(false);
    });
    
    socket.connect(port, host);
  });
}

async function testDatabaseConnection(name, config) {
  try {
    console.log(`\n  Testing: ${name}`);
    console.log(`    Host: ${config.host}:${config.port}`);
    console.log(`    User: ${config.user}`);
    console.log(`    Database: ${config.database || 'None specified'}`);
    
    const connection = await mysql.createConnection(config);
    console.log(`    ✅ ${name} - Connection successful!`);
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT NOW() as current_time');
    console.log(`    ✅ Query test successful: ${rows[0].current_time}`);
    
    // If no database was specified, try to show databases
    if (!config.database) {
      try {
        const [dbs] = await connection.execute('SHOW DATABASES');
        console.log(`    📋 Available databases: ${dbs.map(db => Object.values(db)[0]).join(', ')}`);
      } catch (err) {
        console.log(`    ⚠️  Cannot show databases: ${err.message}`);
      }
    } else {
      // Show tables in the specified database
      try {
        const [tables] = await connection.execute('SHOW TABLES');
        console.log(`    📋 Tables in database: ${tables.length} found`);
      } catch (err) {
        console.log(`    ⚠️  Cannot show tables: ${err.message}`);
      }
    }
    
    await connection.end();
    
  } catch (error) {
    console.log(`    ❌ ${name} - Failed: ${error.code} - ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log(`    💡 Server is not running or not accepting connections`);
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log(`    💡 Authentication failed - check username/password`);
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log(`    💡 Database '${config.database}' does not exist`);
    } else if (error.code === 'ENOTFOUND') {
      console.log(`    💡 Host '${config.host}' not found`);
    }
  }
}

// Run diagnostics
diagnoseConnection().catch(console.error);