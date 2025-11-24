// Configuration example file
// Copy this to config.js and update with your actual values

module.exports = {
  // MongoDB Atlas Configuration
  MONGODB_URI: 'mongodb+srv://achi:YOUR_ACTUAL_PASSWORD@cluster0.gpd2z4o.mongodb.net/smart_waste_management?retryWrites=true&w=majority&appName=Cluster0',
  
  // JWT Configuration
  JWT_SECRET: 'your_super_secret_jwt_key_here_change_in_production',
  JWT_EXPIRE: '7d',
  JWT_REFRESH_SECRET: 'your_super_secret_refresh_key_here',
  JWT_REFRESH_EXPIRE: '30d',
  
  // Server Configuration
  PORT: 5000,
  NODE_ENV: 'development',
  
  // Frontend URL
  FRONTEND_URL: 'http://localhost:3000',
  
  // Email Configuration (for notifications)
  EMAIL_HOST: 'smtp.gmail.com',
  EMAIL_PORT: 587,
  EMAIL_USER: 'your_email@gmail.com',
  EMAIL_PASS: 'your_app_password',
  EMAIL_FROM: 'noreply@smartwastemanagement.com',
  
  // File Upload
  MAX_FILE_SIZE: 10485760, // 10MB
  UPLOAD_PATH: './uploads',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,
  
  // Security
  BCRYPT_ROUNDS: 12,
  SESSION_SECRET: 'your_session_secret_here',
  
  // API Keys (if needed for external services)
  GOOGLE_MAPS_API_KEY: 'your_google_maps_api_key',
  STRIPE_SECRET_KEY: 'your_stripe_secret_key',
  STRIPE_PUBLISHABLE_KEY: 'your_stripe_publishable_key'
};
