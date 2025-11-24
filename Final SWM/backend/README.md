# Smart Waste Management System - Backend API

A comprehensive backend API for the Smart Waste Management System built with Node.js, Express, and MongoDB.

## Features

### Event Management System
- ✅ **Complete Event CRUD Operations**
- ✅ **Event Categories and Filtering**
- ✅ **Event Statistics and Analytics**
- ✅ **Event Search and Pagination**
- ✅ **Event Status Management**

### User Management
- ✅ **User Registration and Authentication**
- ✅ **JWT Token-based Authentication**
- ✅ **User Profile Management**
- ✅ **Role-based Access Control**
- ✅ **Password Security with Bcrypt**

### Booking Management
- ✅ **Event Booking System**
- ✅ **Booking Status Management**
- ✅ **Payment Integration Ready**
- ✅ **Group Discounts**
- ✅ **Booking Analytics**

### Notification System
- ✅ **Real-time Notifications**
- ✅ **Multiple Notification Types**
- ✅ **Bulk Notification Support**
- ✅ **Notification Statistics**

### Reporting System
- ✅ **Comprehensive Analytics**
- ✅ **Data Export (CSV/JSON)**
- ✅ **Revenue Tracking**
- ✅ **User Analytics**
- ✅ **Event Performance Metrics**

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password

### Events
- `GET /api/events` - Get all events (with filtering)
- `GET /api/events/featured` - Get featured events
- `GET /api/events/upcoming` - Get upcoming events
- `GET /api/events/categories` - Get event categories
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `PUT /api/events/:id/status` - Update event status
- `GET /api/events/:id/statistics` - Get event statistics

### Bookings
- `GET /api/bookings` - Get user bookings
- `GET /api/bookings/:id` - Get single booking
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id/status` - Update booking status
- `PUT /api/bookings/:id/cancel` - Cancel booking
- `PUT /api/bookings/:id/checkin` - Check in attendee
- `GET /api/bookings/event/:eventId` - Get event bookings
- `GET /api/bookings/statistics/overview` - Get booking statistics

### Users
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id` - Update user
- `PUT /api/users/:id/status` - Update user status
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/statistics/overview` - Get user statistics
- `GET /api/users/roles/available` - Get available roles
- `POST /api/users/:id/impersonate` - Impersonate user

### Notifications
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/unread-count` - Get unread count
- `GET /api/notifications/:id` - Get single notification
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/:id/unread` - Mark as unread
- `PUT /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification
- `DELETE /api/notifications/clear-all` - Clear all notifications
- `POST /api/notifications/send` - Send notification
- `POST /api/notifications/bulk-send` - Send bulk notifications
- `GET /api/notifications/statistics/overview` - Get notification statistics
- `POST /api/notifications/cleanup` - Cleanup expired notifications

### Reports
- `GET /api/reports/overview` - Get system overview
- `GET /api/reports/events` - Get event analytics
- `GET /api/reports/bookings` - Get booking analytics
- `GET /api/reports/users` - Get user analytics
- `GET /api/reports/notifications` - Get notification analytics
- `GET /api/reports/export` - Export report data

### Other Modules (Placeholder)
- `GET /api/financial/*` - Financial management routes
- `GET /api/feedback/*` - Feedback management routes
- `GET /api/transport/*` - Transport management routes
- `GET /api/user-management/*` - User management routes

## Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Create a `.env` file in the backend directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/smart_waste_management
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=7d
   JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
   JWT_REFRESH_EXPIRE=30d
   FRONTEND_URL=http://localhost:3000
   ```

3. **Start the Server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## Database Models

### User Model
- User authentication and profile management
- Role-based access control
- Account security features
- User statistics and preferences

### Event Model
- Comprehensive event information
- Event status and visibility
- Pricing and discount options
- Event analytics and statistics

### Booking Model
- Event booking management
- Payment tracking
- Attendee information
- Booking status and check-in

### Notification Model
- Multi-channel notifications
- Notification scheduling
- Delivery status tracking
- Notification analytics

## Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - Bcrypt with salt rounds
- **Rate Limiting** - API rate limiting protection
- **Input Validation** - Express-validator for request validation
- **CORS Protection** - Configurable CORS settings
- **Helmet Security** - Security headers
- **Account Lockout** - Protection against brute force attacks

## API Features

- **Pagination** - Efficient data pagination
- **Filtering** - Advanced filtering options
- **Search** - Full-text search capabilities
- **Sorting** - Flexible sorting options
- **Statistics** - Comprehensive analytics
- **Export** - Data export functionality
- **Real-time** - WebSocket support ready

## Development

### Project Structure
```
backend/
├── config/          # Configuration files
├── controllers/      # Route controllers
├── middleware/       # Custom middleware
├── models/          # Database models
├── routes/          # API routes
├── utils/           # Utility functions
├── server.js        # Main server file
└── package.json     # Dependencies
```

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (to be implemented)

## API Documentation

The API follows RESTful conventions and returns JSON responses. All endpoints require authentication unless specified otherwise.

### Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    // Validation errors (if any)
  ]
}
```

## Next Steps

1. **Financial Management** - Implement expense and income tracking
2. **Feedback System** - Build feedback and complaint management
3. **Transport Management** - Create bin, collector, and truck management
4. **User Management** - Implement waste collection requests
5. **Real-time Features** - Add WebSocket support for live updates
6. **Email Integration** - Implement email notifications
7. **File Upload** - Add image and document upload support
8. **Payment Integration** - Connect payment gateways
9. **Testing** - Add comprehensive test coverage
10. **Documentation** - Generate API documentation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
