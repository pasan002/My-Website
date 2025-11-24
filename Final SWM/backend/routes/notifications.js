const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Notification = require('../models/Notification');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user's notifications
// @access  Private
router.get('/', [
  authenticateToken,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isString().withMessage('Type must be a string'),
  query('category').optional().isIn(['info', 'success', 'warning', 'error', 'promotional']).withMessage('Invalid category'),
  query('isRead').optional().isBoolean().withMessage('isRead must be a boolean'),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority')
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

    const {
      page = 1,
      limit = 20,
      type,
      category,
      isRead,
      priority
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      category,
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      priority
    };

    const notifications = await Notification.getUserNotifications(req.user._id, options);

    // Get unread count
    const unreadCount = await Notification.getUnreadCount(req.user._id);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(notifications.length / parseInt(limit)),
          hasNext: notifications.length === parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const unreadCount = await Notification.getUnreadCount(req.user._id);

    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count'
    });
  }
});

// @route   GET /api/notifications/:id
// @desc    Get single notification
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('metadata.eventId', 'title date location')
      .populate('metadata.bookingId', 'bookingNumber status');

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user can view this notification
    if (notification.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this notification'
      });
    }

    res.json({
      success: true,
      data: { notification }
    });
  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification'
    });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user can mark this notification as read
    if (notification.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this notification'
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: { notification }
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
});

// @route   PUT /api/notifications/:id/unread
// @desc    Mark notification as unread
// @access  Private
router.put('/:id/unread', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user can mark this notification as unread
    if (notification.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this notification'
      });
    }

    await notification.markAsUnread();

    res.json({
      success: true,
      message: 'Notification marked as unread',
      data: { notification }
    });
  } catch (error) {
    console.error('Mark notification as unread error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as unread'
    });
  }
});

// @route   PUT /api/notifications/mark-all-read
// @desc    Mark all notifications as read
// @access  Private
router.put('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    await Notification.markAllAsRead(req.user._id);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user can delete this notification
    if (notification.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this notification'
      });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
});

// @route   DELETE /api/notifications/clear-all
// @desc    Clear all notifications
// @access  Private
router.delete('/clear-all', authenticateToken, async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id });

    res.json({
      success: true,
      message: 'All notifications cleared'
    });
  } catch (error) {
    console.error('Clear all notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear all notifications'
    });
  }
});

// @route   POST /api/notifications/send
// @desc    Send notification to user (admin only)
// @access  Private (Admin)
router.post('/send', [
  authenticateToken,
  requireAdmin,
  body('userId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 1000 })
    .withMessage('Message cannot exceed 1000 characters'),
  body('type')
    .isIn([
      'event_created', 'event_updated', 'event_cancelled',
      'booking_confirmed', 'booking_cancelled', 'payment_success',
      'payment_failed', 'reminder', 'system', 'promotional',
      'security', 'welcome', 'password_reset', 'email_verification'
    ])
    .withMessage('Invalid notification type'),
  body('category')
    .optional()
    .isIn(['info', 'success', 'warning', 'error', 'promotional'])
    .withMessage('Invalid category'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority')
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

    const notificationData = {
      ...req.body,
      user: req.body.userId
    };

    const notification = await Notification.createNotification(notificationData);

    res.status(201).json({
      success: true,
      message: 'Notification sent successfully',
      data: { notification }
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification'
    });
  }
});

// @route   POST /api/notifications/bulk-send
// @desc    Send bulk notifications (admin only)
// @access  Private (Admin)
router.post('/bulk-send', [
  authenticateToken,
  requireAdmin,
  body('userIds')
    .isArray({ min: 1 })
    .withMessage('User IDs array is required'),
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 1000 })
    .withMessage('Message cannot exceed 1000 characters'),
  body('type')
    .isIn([
      'event_created', 'event_updated', 'event_cancelled',
      'booking_confirmed', 'booking_cancelled', 'payment_success',
      'payment_failed', 'reminder', 'system', 'promotional',
      'security', 'welcome', 'password_reset', 'email_verification'
    ])
    .withMessage('Invalid notification type')
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

    const { userIds, ...notificationData } = req.body;

    const notifications = await Notification.sendBulkNotifications(userIds, notificationData);

    res.status(201).json({
      success: true,
      message: `Notifications sent to ${notifications.length} users`,
      data: { count: notifications.length }
    });
  } catch (error) {
    console.error('Bulk send notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send bulk notifications'
    });
  }
});

// @route   GET /api/notifications/statistics/overview
// @desc    Get notification statistics
// @access  Private
router.get('/statistics/overview', authenticateToken, async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const statistics = await Notification.getStatistics(req.user._id, dateFrom, dateTo);

    res.json({
      success: true,
      data: { statistics: statistics[0] || {} }
    });
  } catch (error) {
    console.error('Get notification statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification statistics'
    });
  }
});

// @route   POST /api/notifications/cleanup
// @desc    Clean up expired notifications (admin only)
// @access  Private (Admin)
router.post('/cleanup', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await Notification.cleanExpired();

    res.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} expired notifications`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    console.error('Cleanup notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup notifications'
    });
  }
});

module.exports = router;
