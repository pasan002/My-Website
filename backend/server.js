const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Set default JWT secret if not provided
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'default_jwt_secret_for_development_only_change_in_production';
}
if (!process.env.JWT_REFRESH_SECRET) {
  process.env.JWT_REFRESH_SECRET = 'default_refresh_secret_for_development_only_change_in_production';
}

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting (relaxed in development to avoid local throttling)
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // more generous but still protective in production
    message: 'Too many requests from this IP, please try again later.'
  });
  app.use('/api/', limiter);
} else {
  const devLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10000, // effectively disable throttling for local/dev
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use('/api/', devLimiter);
}

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request timeout middleware
app.use((req, res, next) => {
  req.setTimeout(30000, () => {
    res.status(408).json({
      success: false,
      message: 'Request timeout'
    });
  });
  next();
});

// Logging middleware
app.use(morgan('combined'));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/events', require('./routes/events'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reports', require('./routes/reports'));

// Financial Management Routes
app.use('/api/budgets', require('./routes/budget.routes'));
app.use('/api/expenses', require('./routes/expense.routes'));
app.use('/api/incomes', require('./routes/income.routes'));
app.use('/api/financial-reports', require('./routes/financial-reports.routes'));

// Feedback Management Routes
app.use('/api/feedbacks', require('./routes/feedback.routes'));
app.use('/api/complaints', require('./routes/complaint.routes'));

// Transport Management Routes
app.use('/api/bins', require('./routes/bins.routes'));
app.use('/api/collectors', require('./routes/collectors.routes'));
app.use('/api/trucks', require('./routes/trucks.routes'));

// User Management Routes
app.use('/api/user-management', require('./routes/userManagement'));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: errors
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }
  
  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    // MongoDB Atlas connection string - replace <db_password> with your actual password
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://achi:achi%40456@cluster0.gpd2z4o.mongodb.net/smart_waste_management?retryWrites=true&w=majority&appName=Cluster0';
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Do not exit; let the caller decide how to handle retries
    throw error;
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection at:', promise, 'reason:', err);
  // Don't exit the process, just log the error
});

// Handle uncaught exceptions (log only in dev)
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// Start server
const PORT = process.env.PORT || 5000

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const startServer = async () => {
  let attempts = 0;
  const maxAttempts = 10;
  const baseDelayMs = 1000;

  while (true) {
    try {
      await connectDB();

      const server = app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      });

      server.on('error', (err) => {
        console.error('Server error:', err);
      });

      // Wire mongoose connection events for visibility
      const db = mongoose.connection;
      db.on('disconnected', () => {
        console.warn('MongoDB disconnected');
      });
      db.on('reconnected', () => {
        console.log('MongoDB reconnected');
      });
      db.on('error', (err) => {
        console.error('MongoDB runtime error:', err);
      });

      break; // Success
    } catch (error) {
      attempts += 1;
      console.error(`Failed to start server (attempt ${attempts}/${maxAttempts}):`, error?.message || error);
      if (attempts >= maxAttempts) {
        console.error('Max start attempts reached. Not exiting; waiting before retrying.');
        attempts = 0; // keep trying indefinitely in dev
      }
      const waitMs = baseDelayMs * Math.min(attempts, 5);
      console.log(`Retrying in ${waitMs}ms...`);
      await delay(waitMs);
    }
  }
};

startServer();

module.exports = app;
