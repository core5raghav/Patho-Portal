// src/app.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables first
dotenv.config();

const { testConnection } = require('./config/db');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/reports', require('./routes/reportsRoutes'));
app.use('/api/test-results', require('./routes/testResultsRoutes'));
app.use('/uploads', express.static('uploads'));


// Health check route
app.get('/api/health', async (req, res) => {
  const dbStatus = await testConnection();
  
  res.status(200).json({
    success: true,
    message: 'PathoPortal API is running',
    timestamp: new Date().toISOString(),
    database: dbStatus ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Database status route
app.get('/api/db-status', async (req, res) => {
  try {
    const isConnected = await testConnection();
    res.status(200).json({
      success: true,
      database: {
        connected: isConnected,
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        database: process.env.DB_NAME || 'accusterpatho'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection test failed',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

const PORT = process.env.PORT || 3001;

// Initialize server
const startServer = async () => {
  console.log('🚀 Starting PathoPortal Server...');
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 Port: ${PORT}`);
  
  // Test database connection on startup
  await testConnection();
  
  app.listen(PORT, () => {
    console.log(`✅ PathoPortal server running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔗 DB Status: http://localhost:${PORT}/api/db-status`);
  });
};

startServer().catch(console.error);

module.exports = app;