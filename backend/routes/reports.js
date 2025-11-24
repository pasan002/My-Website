const express = require('express');
const { query, validationResult } = require('express-validator');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authenticateToken, requireAdmin, requireAdminOrModerator } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/reports/overview
// @desc    Get system overview statistics
// @access  Private (Admin)
router.get('/overview', [
  authenticateToken,
  requireAdmin,
  query('dateFrom').optional().isISO8601().withMessage('Date from must be a valid date'),
  query('dateTo').optional().isISO8601().withMessage('Date to must be a valid date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { dateFrom, dateTo } = req.query;
    const dateFilter = {};

    if (dateFrom || dateTo) {
      dateFilter.createdAt = {};
      if (dateFrom) dateFilter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.createdAt.$lte = new Date(dateTo);
    }

    // Get basic statistics
    const [
      totalUsers,
      activeUsers,
      totalEvents,
      activeEvents,
      totalBookings,
      confirmedBookings,
      totalRevenue
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Event.countDocuments(),
      Event.countDocuments({ status: 'active' }),
      Booking.countDocuments(dateFilter),
      Booking.countDocuments({ ...dateFilter, status: 'confirmed' }),
      Booking.aggregate([
        { $match: { ...dateFilter, status: { $in: ['confirmed', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$pricing.finalPrice' } } }
      ])
    ]);

    // Get user growth over time
    const userGrowth = await User.aggregate([
      {
        $match: dateFilter
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get event categories distribution
    const eventCategories = await Event.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get booking status distribution
    const bookingStatus = await Booking.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get revenue by month
    const revenueByMonth = await Booking.aggregate([
      {
        $match: {
          ...dateFilter,
          status: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$pricing.finalPrice' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          totalEvents,
          activeEvents,
          totalBookings,
          confirmedBookings,
          totalRevenue: totalRevenue[0]?.total || 0
        },
        charts: {
          userGrowth,
          eventCategories,
          bookingStatus,
          revenueByMonth
        }
      }
    });
  } catch (error) {
    console.error('Get overview report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overview report'
    });
  }
});

// @route   GET /api/reports/events
// @desc    Get event analytics report
// @access  Private (Admin/Moderator)
router.get('/events', [
  authenticateToken,
  requireAdminOrModerator,
  query('dateFrom').optional().isISO8601().withMessage('Date from must be a valid date'),
  query('dateTo').optional().isISO8601().withMessage('Date to must be a valid date'),
  query('category').optional().isString().withMessage('Category must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { dateFrom, dateTo, category } = req.query;
    const filter = {};

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    if (category) filter.category = category;

    // Get event statistics
    const [
      totalEvents,
      eventsByStatus,
      eventsByCategory,
      popularEvents,
      eventsByMonth
    ] = await Promise.all([
      Event.countDocuments(filter),
      Event.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Event.aggregate([
        { $match: filter },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Event.find(filter)
        .sort({ 'statistics.views': -1, 'currentAttendees': -1 })
        .limit(10)
        .populate('organizer', 'firstName lastName email'),
      Event.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalEvents,
        eventsByStatus,
        eventsByCategory,
        popularEvents,
        eventsByMonth
      }
    });
  } catch (error) {
    console.error('Get events report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events report'
    });
  }
});

// @route   GET /api/reports/bookings
// @desc    Get booking analytics report
// @access  Private (Admin/Moderator)
router.get('/bookings', [
  authenticateToken,
  requireAdminOrModerator,
  query('dateFrom').optional().isISO8601().withMessage('Date from must be a valid date'),
  query('dateTo').optional().isISO8601().withMessage('Date to must be a valid date'),
  query('eventId').optional().isMongoId().withMessage('Invalid event ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { dateFrom, dateTo, eventId } = req.query;
    const filter = {};

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    if (eventId) filter.event = eventId;

    // Get booking statistics
    const [
      totalBookings,
      bookingsByStatus,
      revenueByStatus,
      bookingsByMonth,
      topEvents
    ] = await Promise.all([
      Booking.countDocuments(filter),
      Booking.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Booking.aggregate([
        { $match: filter },
        { $group: { _id: '$status', revenue: { $sum: '$pricing.finalPrice' } } },
        { $sort: { revenue: -1 } }
      ]),
      Booking.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 },
            revenue: { $sum: '$pricing.finalPrice' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      Booking.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$event',
            bookings: { $sum: 1 },
            revenue: { $sum: '$pricing.finalPrice' }
          }
        },
        { $sort: { bookings: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'events',
            localField: '_id',
            foreignField: '_id',
            as: 'event'
          }
        },
        { $unwind: '$event' },
        {
          $project: {
            eventTitle: '$event.title',
            eventDate: '$event.date',
            bookings: 1,
            revenue: 1
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalBookings,
        bookingsByStatus,
        revenueByStatus,
        bookingsByMonth,
        topEvents
      }
    });
  } catch (error) {
    console.error('Get bookings report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings report'
    });
  }
});

// @route   GET /api/reports/users
// @desc    Get user analytics report
// @access  Private (Admin)
router.get('/users', [
  authenticateToken,
  requireAdmin,
  query('dateFrom').optional().isISO8601().withMessage('Date from must be a valid date'),
  query('dateTo').optional().isISO8601().withMessage('Date to must be a valid date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { dateFrom, dateTo } = req.query;
    const filter = {};

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    // Get user statistics
    const [
      totalUsers,
      usersByRole,
      usersByStatus,
      userGrowth,
      topUsers
    ] = await Promise.all([
      User.countDocuments(filter),
      User.aggregate([
        { $match: filter },
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      User.aggregate([
        { $match: filter },
        { $group: { _id: '$isActive', count: { $sum: 1 } } }
      ]),
      User.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      User.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'bookings',
            localField: '_id',
            foreignField: 'user',
            as: 'bookings'
          }
        },
        {
          $project: {
            firstName: 1,
            lastName: 1,
            email: 1,
            role: 1,
            bookingCount: { $size: '$bookings' },
            totalSpent: { $sum: '$bookings.pricing.finalPrice' }
          }
        },
        { $sort: { bookingCount: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        usersByRole,
        usersByStatus,
        userGrowth,
        topUsers
      }
    });
  } catch (error) {
    console.error('Get users report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users report'
    });
  }
});

// @route   GET /api/reports/notifications
// @desc    Get notification analytics report
// @access  Private (Admin)
router.get('/notifications', [
  authenticateToken,
  requireAdmin,
  query('dateFrom').optional().isISO8601().withMessage('Date from must be a valid date'),
  query('dateTo').optional().isISO8601().withMessage('Date to must be a valid date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { dateFrom, dateTo } = req.query;
    const filter = {};

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    // Get notification statistics
    const [
      totalNotifications,
      notificationsByType,
      notificationsByCategory,
      readVsUnread,
      notificationsByMonth
    ] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.aggregate([
        { $match: filter },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Notification.aggregate([
        { $match: filter },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Notification.aggregate([
        { $match: filter },
        { $group: { _id: '$isRead', count: { $sum: 1 } } }
      ]),
      Notification.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalNotifications,
        notificationsByType,
        notificationsByCategory,
        readVsUnread,
        notificationsByMonth
      }
    });
  } catch (error) {
    console.error('Get notifications report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications report'
    });
  }
});

// @route   GET /api/reports/export
// @desc    Export report data
// @access  Private (Admin)
router.get('/export', [
  authenticateToken,
  requireAdmin,
  query('type').isIn(['events', 'bookings', 'users', 'notifications']).withMessage('Invalid export type'),
  query('format').optional().isIn(['csv', 'json']).withMessage('Invalid format'),
  query('dateFrom').optional().isISO8601().withMessage('Date from must be a valid date'),
  query('dateTo').optional().isISO8601().withMessage('Date to must be a valid date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { type, format = 'json', dateFrom, dateTo } = req.query;
    const filter = {};

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    let data = [];
    let filename = '';

    switch (type) {
      case 'events':
        data = await Event.find(filter)
          .populate('organizer', 'firstName lastName email')
          .lean();
        filename = `events_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'bookings':
        data = await Booking.find(filter)
          .populate('event', 'title date location')
          .populate('user', 'firstName lastName email')
          .lean();
        filename = `bookings_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'users':
        data = await User.find(filter)
          .select('-password -emailVerificationToken -passwordResetToken')
          .lean();
        filename = `users_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'notifications':
        data = await Notification.find(filter)
          .populate('user', 'firstName lastName email')
          .lean();
        filename = `notifications_${new Date().toISOString().split('T')[0]}`;
        break;
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      return res.send(csv);
    }

    res.json({
      success: true,
      data: {
        type,
        format,
        count: data.length,
        filename: `${filename}.${format}`,
        data
      }
    });
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export report'
    });
  }
});

// Helper function to convert data to CSV
function convertToCSV(data) {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'object' && value !== null) {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        return `"${String(value || '').replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');

  return csvContent;
}

module.exports = router;
