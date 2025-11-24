const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const { authenticateToken, requireAdminOrModerator } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/bookings
// @desc    Get user's bookings or all bookings (admin)
// @access  Private
router.get('/', [
  authenticateToken,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending', 'confirmed', 'cancelled', 'completed', 'no-show']).withMessage('Invalid status'),
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

    const {
      page = 1,
      limit = 10,
      status,
      eventId
    } = req.query;

    // Build filter object
    const filter = {};

    // If not admin-like, only show user's own bookings
    const adminLikeRoles = ['admin', 'event_admin'];
    if (!adminLikeRoles.includes(req.user.role)) {
      filter.user = req.user._id;
    }

    if (status) filter.status = status;
    if (eventId) filter.event = eventId;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const bookings = await Booking.find(filter)
      .populate('event', 'title date location venue')
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalBookings: total,
          hasNext: skip + bookings.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings'
    });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get single booking
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('event', 'title date location venue organizer')
      .populate('user', 'firstName lastName email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user can view this booking
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    res.json({
      success: true,
      data: { booking }
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking'
    });
  }
});

// @route   POST /api/bookings
// @desc    Create new booking
// @access  Private
router.post('/', [
  authenticateToken,
  body('eventId')
    .isMongoId()
    .withMessage('Valid event ID is required'),
  body('attendeeDetails.firstName')
    .notEmpty()
    .withMessage('First name is required'),
  body('attendeeDetails.lastName')
    .notEmpty()
    .withMessage('Last name is required'),
  body('attendeeDetails.email')
    .isEmail()
    .withMessage('Valid email is required'),
  body('additionalAttendees')
    .optional()
    .isArray()
    .withMessage('Additional attendees must be an array'),
  body('specialRequests')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Special requests cannot exceed 500 characters')
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

    const { eventId, attendeeDetails, additionalAttendees = [], specialRequests } = req.body;

    // Check if event exists and is available for booking
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Relax booking rules for dashboard participation: allow booking if event date is in the future
    const now = new Date();
    const registrationDeadline = event.registrationDeadline ? new Date(event.registrationDeadline) : new Date(event.date);
    if (new Date(event.date) < now) {
      return res.status(400).json({
        success: false,
        message: 'This event has already passed'
      });
    }
    if (now > registrationDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Registration is closed for this event'
      });
    }

    // For testing: allow duplicate bookings (even if confirmed/pending exists)

    // Calculate total attendees
    const totalAttendees = 1 + (Array.isArray(additionalAttendees) ? additionalAttendees.length : 0);

    // Calculate pricing
    const basePrice = Number(event.getCurrentPrice?.() ?? event.price ?? 0) || 0;
    let totalPrice = Number(basePrice) * Number(totalAttendees);

    // Apply group discount if applicable
    if (event.groupDiscount?.enabled && totalAttendees >= (event.groupDiscount.minGroupSize || 0)) {
      const discount = (totalPrice * event.groupDiscount.discountPercentage) / 100;
      totalPrice -= discount;
    }

    // Create booking
    const booking = new Booking({
      event: eventId,
      user: req.user._id,
      attendeeDetails,
      additionalAttendees,
      specialRequests,
      pricing: {
        basePrice: basePrice,
        groupDiscount: event.groupDiscount.enabled && totalAttendees >= event.groupDiscount.minGroupSize 
          ? (basePrice * totalAttendees * event.groupDiscount.discountPercentage) / 100 
          : 0,
        totalDiscount: event.groupDiscount.enabled && totalAttendees >= event.groupDiscount.minGroupSize 
          ? (basePrice * totalAttendees * event.groupDiscount.discountPercentage) / 100 
          : 0,
        finalPrice: totalPrice,
        currency: event.currency
      },
      // Always create as pending so admin can approve/reject
      status: 'pending',
      paymentStatus: totalPrice > 0 ? 'pending' : 'paid'
    });

    await booking.save();

    // Do not increment attendees until approved

    await booking.populate('event', 'title date location venue');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: { booking }
    });
  } catch (error) {
    console.error('Create booking error:', error);
    const msg = (error && error.message) ? error.message : 'Failed to create booking';
    res.status(500).json({
      success: false,
      message: msg
    });
  }
});

// @route   PUT /api/bookings/:id/status
// @desc    Update booking status
// @access  Private (Admin/Moderator)
router.put('/:id/status', [
  authenticateToken,
  requireAdminOrModerator,
  body('status')
    .isIn(['pending', 'confirmed', 'cancelled', 'completed', 'no-show'])
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

    const { status } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const oldStatus = booking.status;
    booking.status = status;

    // Handle status-specific logic
    if (status === 'confirmed' && oldStatus === 'pending') {
      // Update event attendee count
      await Event.findByIdAndUpdate(booking.event, {
        $inc: { currentAttendees: booking.totalAttendees }
      });
    } else if (status === 'cancelled' && oldStatus === 'confirmed') {
      // Decrease event attendee count
      await Event.findByIdAndUpdate(booking.event, {
        $inc: { currentAttendees: -booking.totalAttendees }
      });
    }

    await booking.save();

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: { booking }
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status'
    });
  }
});

// @route   DELETE /api/bookings/:id
// @desc    Delete a booking (admin/moderator). If confirmed, decrement attendees
// @access  Private (Admin/Moderator)
router.delete('/:id', [authenticateToken, requireAdminOrModerator], async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // If booking was confirmed, decrement attendee count
    if (booking.status === 'confirmed') {
      await Event.findByIdAndUpdate(booking.event, {
        $inc: { currentAttendees: -booking.totalAttendees }
      });
    }

    await Booking.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete booking' });
  }
});

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel booking
// @access  Private
router.put('/:id/cancel', [
  authenticateToken,
  body('reason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters')
], async (req, res) => {
  try {
    const { reason } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user can cancel this booking
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    // Check if cancellation is allowed
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    // Get event to check cancellation policy
    const event = await Event.findById(booking.event);
    if (!event.isCancellationAllowed()) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation is not allowed for this event'
      });
    }

    // Cancel booking
    await booking.cancelBooking(reason, req.user._id);

    // Update event attendee count
    await Event.findByIdAndUpdate(booking.event, {
      $inc: { currentAttendees: -booking.totalAttendees }
    });

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: { booking }
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking'
    });
  }
});

// @route   PUT /api/bookings/:id/checkin
// @desc    Check in attendee
// @access  Private (Admin/Moderator/Organizer)
router.put('/:id/checkin', authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user can check in this booking
    const event = await Event.findById(booking.event);
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to check in this booking'
      });
    }

    if (booking.checkInStatus.checkedIn) {
      return res.status(400).json({
        success: false,
        message: 'Attendee is already checked in'
      });
    }

    await booking.checkIn(req.user._id);

    res.json({
      success: true,
      message: 'Attendee checked in successfully',
      data: { booking }
    });
  } catch (error) {
    console.error('Check in error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check in attendee'
    });
  }
});

// @route   GET /api/bookings/event/:eventId
// @desc    Get bookings for a specific event
// @access  Private (Organizer/Admin)
router.get('/event/:eventId', authenticateToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user can view bookings for this event
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view bookings for this event'
      });
    }

    const bookings = await Booking.getBookingsByEvent(req.params.eventId);

    res.json({
      success: true,
      data: { bookings }
    });
  } catch (error) {
    console.error('Get event bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event bookings'
    });
  }
});

// @route   GET /api/bookings/statistics/overview
// @desc    Get booking statistics overview
// @access  Private (Admin)
router.get('/statistics/overview', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { dateFrom, dateTo } = req.query;
    const filter = {};

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const [
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      revenueStats
    ] = await Promise.all([
      Booking.countDocuments(filter),
      Booking.countDocuments({ ...filter, status: 'confirmed' }),
      Booking.countDocuments({ ...filter, status: 'cancelled' }),
      Booking.aggregate([
        { $match: { ...filter, status: { $in: ['confirmed', 'completed'] } } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$pricing.finalPrice' },
            averageBookingValue: { $avg: '$pricing.finalPrice' }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        pendingBookings: totalBookings - confirmedBookings - cancelledBookings,
        totalRevenue: revenueStats[0]?.totalRevenue || 0,
        averageBookingValue: revenueStats[0]?.averageBookingValue || 0
      }
    });
  } catch (error) {
    console.error('Get booking statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking statistics'
    });
  }
});

module.exports = router;
