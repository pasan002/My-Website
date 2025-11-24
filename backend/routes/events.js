const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Event = require('../models/Event');
const { authenticateToken, requireAdminOrModerator, requireOrganizerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/events
// @desc    Get all events with filtering and pagination
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isIn([
    'conference', 'workshop', 'seminar', 'meeting', 'party', 
    'networking', 'training', 'exhibition', 'concert', 'sports', 
    'waste-management', 'environmental', 'community', 'other'
  ]).withMessage('Invalid category'),
  query('status').optional().isIn(['draft', 'active', 'cancelled', 'completed', 'postponed']).withMessage('Invalid status'),
  query('city').optional().isString().withMessage('City must be a string'),
  query('dateFrom').optional().isISO8601().withMessage('Date from must be a valid date'),
  query('dateTo').optional().isISO8601().withMessage('Date to must be a valid date'),
  query('search').optional().isString().withMessage('Search must be a string')
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
      limit = 10,
      category,
      status, // Removed default status to show all events
      city,
      dateFrom,
      dateTo,
      search,
      sortBy = 'date',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = {};

    if (category) filter.category = category;
    if (status) filter.status = status;
    if (city) filter['venue.city'] = new RegExp(city, 'i');

    // Date range filter
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    // Search filter
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const events = await Event.find(filter)
      .populate('organizer', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Event.countDocuments(filter);

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalEvents: total,
          hasNext: skip + events.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events'
    });
  }
});

// @route   GET /api/events/featured
// @desc    Get featured/popular events
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    const events = await Event.getPopularEvents(limit);

    res.json({
      success: true,
      data: { events }
    });
  } catch (error) {
    console.error('Get featured events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured events'
    });
  }
});

// @route   GET /api/events/upcoming
// @desc    Get upcoming events
// @access  Public
router.get('/upcoming', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Show any upcoming events regardless of status (draft/active), ordered by date
    let events = await Event.find({ date: { $gte: new Date() } })
      .sort({ date: 1 })
      .limit(limit);

    // If none found, fall back to most recent future-or-recent events
    if (!events || events.length === 0) {
      events = await Event.find({})
        .sort({ date: -1 })
        .limit(limit);
    }

    res.json({
      success: true,
      data: { events }
    });
  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming events'
    });
  }
});

// @route   GET /api/events/categories
// @desc    Get event categories with counts
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Event.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

// @route   GET /api/events/:id
// @desc    Get single event by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'firstName lastName email avatar')
      .populate('coOrganizers', 'firstName lastName email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Increment views
    await event.incrementViews();

    res.json({
      success: true,
      data: { event }
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event'
    });
  }
});

// @route   POST /api/events
// @desc    Create new event
// @access  Private (Organizer/Admin)
router.post('/', [
  // authenticateToken,
  // requireOrganizerOrAdmin,
  body('title')
    .notEmpty()
    .withMessage('Event title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('description')
    .notEmpty()
    .withMessage('Event description is required')
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('date')
    .isISO8601()
    .withMessage('Event date must be a valid date')
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error('Event date cannot be in the past');
      }
      return true;
    }),
  body('time')
    .notEmpty()
    .withMessage('Event time is required'),
  body('location')
    .notEmpty()
    .withMessage('Event location is required'),
  body('category')
    .isIn([
      'conference', 'workshop', 'seminar', 'meeting', 'party', 
      'networking', 'training', 'exhibition', 'concert', 'sports', 
      'waste-management', 'environmental', 'community', 'other'
    ])
    .withMessage('Invalid category'),
  body('maxAttendees')
    .isInt({ min: 1 })
    .withMessage('Maximum attendees must be at least 1'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price cannot be negative')
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

    const eventData = {
      ...req.body,
      organizer: req.user ? req.user._id : null // Allow null organizer for testing
    };

    const event = new Event(eventData);
    await event.save();

    await event.populate('organizer', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: { event }
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event'
    });
  }
});

// @route   PUT /api/events/:id
// @desc    Update event
// @access  Private (Organizer/Admin) - Temporarily public for testing
router.put('/:id', [
  // authenticateToken, // Temporarily disabled for testing
  body('title')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Event date must be a valid date'),
  body('maxAttendees')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Maximum attendees must be at least 1'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price cannot be negative')
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

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user can update this event - Temporarily disabled for testing
    // if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Not authorized to update this event'
    //   });
    // }

    // Update event
    Object.assign(event, req.body);
    await event.save();

    await event.populate('organizer', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: { event }
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event'
    });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete event
// @access  Private (Organizer/Admin) - Temporarily public for testing
router.delete('/:id', /* authenticateToken, */ async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user can delete this event - Temporarily disabled for testing
    // if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Not authorized to delete this event'
    //   });
    // }

    await Event.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event'
    });
  }
});

// @route   PUT /api/events/:id/status
// @desc    Update event status
// @access  Private (Organizer/Admin)
router.put('/:id/status', [
  authenticateToken,
  body('status')
    .isIn(['draft', 'active', 'cancelled', 'completed', 'postponed'])
    .withMessage('Invalid status')
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

    const { status, cancellationReason } = req.body;

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user can update this event
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this event'
      });
    }

    // Update status
    event.status = status;
    
    if (status === 'cancelled' && cancellationReason) {
      event.cancellationReason = cancellationReason;
      event.cancellationDate = new Date();
    }

    await event.save();

    res.json({
      success: true,
      message: 'Event status updated successfully',
      data: { event }
    });
  } catch (error) {
    console.error('Update event status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event status'
    });
  }
});

// @route   GET /api/events/:id/statistics
// @desc    Get event statistics
// @access  Private (Organizer/Admin)
router.get('/:id/statistics', authenticateToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user can view statistics
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view event statistics'
      });
    }

    // Get booking statistics
    const Booking = require('../models/Booking');
    const stats = await Booking.getBookingStats(req.params.id);

    res.json({
      success: true,
      data: {
        event: {
          id: event._id,
          title: event.title,
          currentAttendees: event.currentAttendees,
          maxAttendees: event.maxAttendees,
          views: event.statistics.views,
          shares: event.statistics.shares,
          likes: event.statistics.likes
        },
        bookingStats: stats
      }
    });
  } catch (error) {
    console.error('Get event statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event statistics'
    });
  }
});

module.exports = router;
