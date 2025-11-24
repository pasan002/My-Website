const express = require('express');
const { body, validationResult, query } = require('express-validator');
const mongoose = require('mongoose');
const Income = require('../models/Income');
const { authenticateToken, requireAdminOrModerator } = require('../middleware/auth');

const router = express.Router();

// Simple health check for incomes
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Income routes are working',
    timestamp: new Date().toISOString()
  });
});

// @route   GET /api/incomes
// @desc    Get all incomes with filtering and pagination
// @access  Private
router.get('/', [
  // authenticateToken, // Temporarily disabled for testing
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isIn([
    'service_fees', 'waste_collection', 'recycling_revenue', 'government_grants',
    'donations', 'sponsorships', 'consulting', 'equipment_sales', 'rental_income',
    'penalties', 'licensing', 'training_fees', 'other'
  ]).withMessage('Invalid category'),
  query('status').optional().isIn(['pending', 'confirmed', 'received', 'cancelled']).withMessage('Invalid status'),
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

    const {
      page = 1,
      limit = 10,
      category,
      status,
      dateFrom,
      dateTo,
      search,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    if (category) filter.category = category;
    if (status) filter.status = status;

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
        { source: new RegExp(search, 'i') },
        { 'client.name': new RegExp(search, 'i') }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with error handling
    let incomes, total;
    try {
      incomes = await Income.find(filter)
        .populate('createdBy', 'firstName lastName email')
        .populate('confirmedBy', 'firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      total = await Income.countDocuments(filter);
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Database query failed'
      });
    }

    res.json({
      success: true,
      data: {
        incomes,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalIncomes: total,
          hasNext: skip + incomes.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get incomes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch incomes'
    });
  }
});

// @route   GET /api/incomes/summary
// @desc    Get income summary statistics
// @access  Private
router.get('/summary', /* authenticateToken, */ async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const filters = {};

    if (dateFrom || dateTo) {
      filters.date = {};
      if (dateFrom) filters.date.$gte = new Date(dateFrom);
      if (dateTo) filters.date.$lte = new Date(dateTo);
    }

    let summary, categoryBreakdown, monthlyTrends, topSources;
    try {
      summary = await Income.getIncomeSummary(filters);
      categoryBreakdown = await Income.getIncomeByCategory(filters);
      monthlyTrends = await Income.getMonthlyTrends(filters, 12);
      topSources = await Income.getTopSources(filters, 10);
    } catch (dbError) {
      console.error('Database summary query error:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch income summary data'
      });
    }

    res.json({
      success: true,
      data: {
        summary,
        categoryBreakdown,
        monthlyTrends,
        topSources
      }
    });
  } catch (error) {
    console.error('Get income summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch income summary'
    });
  }
});

// @route   GET /api/incomes/:id
// @desc    Get single income by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const income = await Income.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('confirmedBy', 'firstName lastName email');

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Income not found'
      });
    }

    res.json({
      success: true,
      data: { income }
    });
  } catch (error) {
    console.error('Get income error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch income'
    });
  }
});

// @route   POST /api/incomes
// @desc    Create new income
// @access  Private
router.post('/', [
  // authenticateToken, // Temporarily disabled for testing
  body('title')
    .notEmpty()
    .withMessage('Income title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('category')
    .isIn([
      'service_fees', 'waste_collection', 'recycling_revenue', 'government_grants',
      'donations', 'sponsorships', 'consulting', 'equipment_sales', 'rental_income',
      'penalties', 'licensing', 'training_fees', 'other'
    ])
    .withMessage('Invalid category'),
  body('source')
    .notEmpty()
    .withMessage('Income source is required')
    .isLength({ max: 100 })
    .withMessage('Source cannot exceed 100 characters'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid date'),
  body('currency')
    .optional()
    .isIn(['LKR', 'USD', 'EUR', 'GBP'])
    .withMessage('Invalid currency'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'card', 'bank_transfer', 'check', 'digital_wallet', 'other'])
    .withMessage('Invalid payment method')
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

    const incomeData = {
      ...req.body,
      createdBy: req.user ? req.user._id : new mongoose.Types.ObjectId('507f1f77bcf86cd799439011') // Assign a dummy user for testing if auth is off
    };

    const income = new Income(incomeData);
    await income.save();

    await income.populate('createdBy', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Income created successfully',
      data: { income }
    });
  } catch (error) {
    console.error('Create income error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create income'
    });
  }
});

// @route   PUT /api/incomes/:id
// @desc    Update income
// @access  Private
router.put('/:id', [
  // authenticateToken, // Temporarily disabled for testing
  body('title')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('source')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Source cannot exceed 100 characters')
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

    const income = await Income.findById(req.params.id);

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Income not found'
      });
    }

    // Check if user can update this income (disabled for testing)
    // if (income.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Not authorized to update this income'
    //   });
    // }

    // Update income
    Object.assign(income, req.body);
    await income.save();

    await income.populate('createdBy', 'firstName lastName email');
    await income.populate('confirmedBy', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Income updated successfully',
      data: { income }
    });
  } catch (error) {
    console.error('Update income error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update income'
    });
  }
});

// @route   DELETE /api/incomes/:id
// @desc    Delete income
// @access  Private
router.delete('/:id', /* authenticateToken, */ async (req, res) => {
  try {
    const income = await Income.findById(req.params.id);

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Income not found'
      });
    }

    // Check if user can delete this income (disabled for testing)
    // if (income.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Not authorized to delete this income'
    //   });
    // }

    await Income.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Income deleted successfully'
    });
  } catch (error) {
    console.error('Delete income error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete income'
    });
  }
});

// @route   PUT /api/incomes/:id/confirm
// @desc    Confirm income
// @access  Private (Admin/Moderator)
router.put('/:id/confirm', [
  authenticateToken,
  requireAdminOrModerator
], async (req, res) => {
  try {
    const income = await Income.findById(req.params.id);

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Income not found'
      });
    }

    await income.confirm(req.user._id);

    await income.populate('createdBy', 'firstName lastName email');
    await income.populate('confirmedBy', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Income confirmed successfully',
      data: { income }
    });
  } catch (error) {
    console.error('Confirm income error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm income'
    });
  }
});

// @route   PUT /api/incomes/:id/received
// @desc    Mark income as received
// @access  Private
router.put('/:id/received', authenticateToken, async (req, res) => {
  try {
    const income = await Income.findById(req.params.id);

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Income not found'
      });
    }

    // Check if user can mark this income as received
    if (income.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to mark this income as received'
      });
    }

    await income.markAsReceived(req.user._id);

    await income.populate('createdBy', 'firstName lastName email');
    await income.populate('confirmedBy', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Income marked as received successfully',
      data: { income }
    });
  } catch (error) {
    console.error('Mark income as received error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark income as received'
    });
  }
});

// @route   PUT /api/incomes/:id/cancel
// @desc    Cancel income
// @access  Private
router.put('/:id/cancel', [
  authenticateToken,
  body('reason')
    .notEmpty()
    .withMessage('Cancellation reason is required')
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

    const income = await Income.findById(req.params.id);

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Income not found'
      });
    }

    // Check if user can cancel this income
    if (income.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this income'
      });
    }

    await income.cancel(req.user._id, req.body.reason);

    await income.populate('createdBy', 'firstName lastName email');
    await income.populate('confirmedBy', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Income cancelled successfully',
      data: { income }
    });
  } catch (error) {
    console.error('Cancel income error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel income'
    });
  }
});

module.exports = router;
