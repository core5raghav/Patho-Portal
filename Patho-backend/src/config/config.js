const config = {
  // Server configuration
  port: parseInt(process.env.PORT),
  nodeEnv: process.env.NODE_ENV,
  
  // MySQL Database configuration
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
    connectionLimit: 10,
    connectTimeout: 60000,
    idleTimeout: 600000,
    charset: 'utf8mb4'
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN
  },
  
  // Email configuration
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM
  },
  
  // File upload configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    path: process.env.UPLOAD_PATH,
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedDocTypes: [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
  },
  
  // Rate limiting configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
  },
  
  // CORS configuration
  cors: {
    allowedOrigins: process.env.CLIENT_URL?.split(',')
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL
  },
  
  // Pagination defaults
  pagination: {
    defaultPage: 1,
    defaultLimit: 10,
    maxLimit: 100
  },
  
  // Pathology-specific configurations
  testCategories: {
    BLOOD: 'blood',
    URINE: 'urine',
    STOOL: 'stool',
    TISSUE: 'tissue',
    CYTOLOGY: 'cytology',
    MICROBIOLOGY: 'microbiology',
    BIOCHEMISTRY: 'biochemistry',
    HEMATOLOGY: 'hematology'
  },
  
  // Test result status options
  testResultStatus: {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    VERIFIED: 'verified',
    CANCELLED: 'cancelled'
  },
  
  // Report status options
  reportStatus: {
    DRAFT: 'draft',
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    ARCHIVED: 'archived'
  },
  
  // Test result values
  testResults: {
    NORMAL: 'normal',
    ABNORMAL: 'abnormal',
    CRITICAL: 'critical',
    PENDING: 'pending'
  },
  
  // User roles for pathology system
  userRoles: {
    ADMIN: 'admin',
    PATHOLOGIST: 'pathologist',
    LAB_TECHNICIAN: 'lab_technician',
    NURSE: 'nurse',
    RECEPTIONIST: 'receptionist',
    DOCTOR: 'doctor'
  },
  
  // Sample priorities
  samplePriority: {
    ROUTINE: 'routine',
    URGENT: 'urgent',
    STAT: 'stat',
    CRITICAL: 'critical'
  }
};

module.exports = config;