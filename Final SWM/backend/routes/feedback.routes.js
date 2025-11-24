const express = require('express');
const { body, validationResult, query } = require('express-validator');
const mongoose = require('mongoose');
const Feedback = require('../models/Feedback');
const { authenticateToken, requireAdminOrModerator } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/feedbacks
// @desc    Get all feedbacks with filtering and pagination
// @access  Public (for testing)
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  query('status').optional().isIn(['pending', 'reviewed', 'resolved']).withMessage('Invalid status'),
  query('category').optional().isIn(['service', 'quality', 'delivery', 'staff', 'facility', 'other']).withMessage('Invalid category')
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
      rating,
      status,
      category,
      search,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    if (rating) filter.rating = parseInt(rating);
    if (status) filter.status = status;
    if (category) filter.category = category;

    // Search filter
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { comment: new RegExp(search, 'i') }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const feedbacks = await Feedback.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Feedback.countDocuments(filter);

    res.json({
      success: true,
      data: {
        feedbacks,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalFeedbacks: total,
          hasNext: skip + feedbacks.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get feedbacks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedbacks'
    });
  }
});

// @route   GET /api/feedbacks/summary
// @desc    Get feedback summary statistics
// @access  Public (for testing)
router.get('/summary', /* authenticateToken, */ async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const filters = {};

    if (dateFrom || dateTo) {
      filters.date = {};
      if (dateFrom) filters.date.$gte = new Date(dateFrom);
      if (dateTo) filters.date.$lte = new Date(dateTo);
    }

    // Get rating distribution
    const ratingStats = await Feedback.aggregate([
      { $match: filters },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get category distribution
    const categoryStats = await Feedback.aggregate([
      { $match: filters },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get status distribution
    const statusStats = await Feedback.aggregate([
      { $match: filters },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate average rating
    const avgRatingResult = await Feedback.aggregate([
      { $match: filters },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalFeedbacks: { $sum: 1 }
        }
      }
    ]);

    const summary = {
      totalFeedbacks: avgRatingResult[0]?.totalFeedbacks || 0,
      averageRating: avgRatingResult[0]?.averageRating || 0,
      ratingDistribution: ratingStats,
      categoryDistribution: categoryStats,
      statusDistribution: statusStats
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get feedback summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback summary'
    });
  }
});

// @route   GET /api/feedbacks/:id
// @desc    Get single feedback by ID
// @access  Public (for testing)
router.get('/:id', /* authenticateToken, */ async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email');

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.json({
      success: true,
      data: { feedback }
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback'
    });
  }
});

// @route   POST /api/feedbacks
// @desc    Create new feedback
// @access  Public (for testing)
router.post('/', [
  // authenticateToken, // Temporarily disabled for testing
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .notEmpty()
    .withMessage('Comment is required')
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters'),
  body('category')
    .optional()
    .isIn(['service', 'quality', 'delivery', 'staff', 'facility', 'other'])
    .withMessage('Invalid category')
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

    const feedbackData = {
      ...req.body,
      createdBy: req.user ? req.user._id : new mongoose.Types.ObjectId() // Assign a dummy user for testing if auth is off
    };

    const feedback = new Feedback(feedbackData);
    await feedback.save();

    await feedback.populate('createdBy', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Feedback created successfully',
      data: { feedback }
    });
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create feedback'
    });
  }
});

// @route   PUT /api/feedbacks/:id
// @desc    Update feedback
// @access  Private
router.put('/:id', [
  // authenticateToken, // Temporarily disabled for testing
  body('name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters'),
  body('status')
    .optional()
    .isIn(['pending', 'reviewed', 'resolved'])
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

    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Check if user can update this feedback (disabled for testing)
    // if (feedback.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Not authorized to update this feedback'
    //   });
    // }

    // Update feedback
    Object.assign(feedback, req.body);
    await feedback.save();

    await feedback.populate('createdBy', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Feedback updated successfully',
      data: { feedback }
    });
  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update feedback'
    });
  }
});

// @route   DELETE /api/feedbacks/:id
// @desc    Delete feedback
// @access  Private
router.delete('/:id', /* authenticateToken, */ async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Check if user can delete this feedback (disabled for testing)
    // if (feedback.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Not authorized to delete this feedback'
    //   });
    // }

    await Feedback.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete feedback'
    });
  }
});

// @route   POST /api/feedbacks/:id/reply
// @desc    Add reply to feedback
// @access  Private (Admin/Moderator)
router.post('/:id/reply', [
  // authenticateToken, // Temporarily disabled for testing
  // requireAdminOrModerator, // Temporarily disabled for testing
  body('admin')
    .notEmpty()
    .withMessage('Admin name is required')
    .isLength({ max: 100 })
    .withMessage('Admin name cannot exceed 100 characters'),
  body('text')
    .notEmpty()
    .withMessage('Reply text is required')
    .isLength({ max: 1000 })
    .withMessage('Reply text cannot exceed 1000 characters')
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

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    feedback.replies.push({
      admin: req.body.admin,
      text: req.body.text,
      date: new Date()
    });

    const updatedFeedback = await feedback.save();
    await updatedFeedback.populate('createdBy', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Reply added successfully',
      data: { feedback: updatedFeedback }
    });
  } catch (error) {
    console.error('Add reply error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add reply'
    });
  }
});

// @route   PUT /api/feedbacks/:id/reply/:replyId
// @desc    Update reply
// @access  Private (Admin/Moderator)
router.put('/:id/reply/:replyId', [
  // authenticateToken, // Temporarily disabled for testing
  // requireAdminOrModerator, // Temporarily disabled for testing
  body('text')
    .notEmpty()
    .withMessage('Reply text is required')
    .isLength({ max: 1000 })
    .withMessage('Reply text cannot exceed 1000 characters')
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

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    const reply = feedback.replies.id(req.params.replyId);
    if (!reply) {
      return res.status(404).json({
        success: false,
        message: 'Reply not found'
      });
    }

    reply.text = req.body.text;
    reply.date = new Date();

    const updatedFeedback = await feedback.save();
    await updatedFeedback.populate('createdBy', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Reply updated successfully',
      data: { feedback: updatedFeedback }
    });
  } catch (error) {
    console.error('Update reply error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update reply'
    });
  }
});

// @route   DELETE /api/feedbacks/:id/reply/:replyId
// @desc    Delete reply
// @access  Private (Admin/Moderator)
router.delete('/:id/reply/:replyId', [
  // authenticateToken, // Temporarily disabled for testing
  // requireAdminOrModerator // Temporarily disabled for testing
], async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    const reply = feedback.replies.id(req.params.replyId);
    if (!reply) {
      return res.status(404).json({
        success: false,
        message: 'Reply not found'
      });
    }

    reply.deleteOne();

    const updatedFeedback = await feedback.save();
    await updatedFeedback.populate('createdBy', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Reply deleted successfully',
      data: { feedback: updatedFeedback }
    });
  } catch (error) {
    console.error('Delete reply error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete reply'
    });
  }
});

module.exports = router;
