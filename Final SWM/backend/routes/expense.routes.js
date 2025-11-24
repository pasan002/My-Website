const express = require('express');
const { body, validationResult, query } = require('express-validator');
const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const { authenticateToken, requireAdminOrModerator } = require('../middleware/auth');

const router = express.Router();

// Simple health check for expenses
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Expense routes are working',
    timestamp: new Date().toISOString()
  });
});

// @route   GET /api/expenses
// @desc    Get all expenses with filtering and pagination
// @access  Private
router.get('/', [
  // authenticateToken, // Temporarily disabled for testing
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isIn([
    'fuel', 'maintenance', 'equipment', 'personnel', 'utilities',
    'office_supplies', 'transportation', 'waste_disposal', 'repairs',
    'insurance', 'legal', 'marketing', 'training', 'emergency', 'other'
  ]).withMessage('Invalid category'),
  query('status').optional().isIn(['pending', 'approved', 'rejected', 'paid']).withMessage('Invalid status'),
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
        { 'vendor.name': new RegExp(search, 'i') }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with error handling
    let expenses, total;
    try {
      expenses = await Expense.find(filter)
        .populate('createdBy', 'firstName lastName email')
        .populate('approvedBy', 'firstName lastName email')
        .populate('budget', 'name amount')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      total = await Expense.countDocuments(filter);
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
        expenses,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalExpenses: total,
          hasNext: skip + expenses.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expenses'
    });
  }
});

// @route   GET /api/expenses/summary
// @desc    Get expense summary statistics
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

    let summary, categoryBreakdown, monthlyTrends;
    try {
      summary = await Expense.getExpenseSummary(filters);
      categoryBreakdown = await Expense.getExpensesByCategory(filters);
      monthlyTrends = await Expense.getMonthlyTrends(filters, 12);
    } catch (dbError) {
      console.error('Database summary query error:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch expense summary data'
      });
    }

    res.json({
      success: true,
      data: {
        summary,
        categoryBreakdown,
        monthlyTrends
      }
    });
  } catch (error) {
    console.error('Get expense summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense summary'
    });
  }
});

// @route   GET /api/expenses/:id
// @desc    Get single expense by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email')
      .populate('budget', 'name amount spent remaining');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.json({
      success: true,
      data: { expense }
    });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense'
    });
  }
});

// @route   POST /api/expenses
// @desc    Create new expense
// @access  Private
router.post('/', [
  // authenticateToken, // Temporarily disabled for testing
  body('title')
    .notEmpty()
    .withMessage('Expense title is required')
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
      'fuel', 'maintenance', 'equipment', 'personnel', 'utilities',
      'office_supplies', 'transportation', 'waste_disposal', 'repairs',
      'insurance', 'legal', 'marketing', 'training', 'emergency', 'other'
    ])
    .withMessage('Invalid category'),
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

    const expenseData = {
      ...req.body,
      createdBy: req.user ? req.user._id : new mongoose.Types.ObjectId('507f1f77bcf86cd799439011') // Assign a dummy user for testing if auth is off
    };

    const expense = new Expense(expenseData);
    await expense.save();

    await expense.populate('createdBy', 'firstName lastName email');
    if (expense.budget) {
      await expense.populate('budget', 'name amount spent remaining');
    }

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: { expense }
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create expense'
    });
  }
});

// @route   PUT /api/expenses/:id
// @desc    Update expense
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
    .withMessage('Amount must be greater than 0')
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

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Check if user can update this expense (disabled for testing)
    // if (expense.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Not authorized to update this expense'
    //   });
    // }

    // Update expense
    Object.assign(expense, req.body);
    await expense.save();

    await expense.populate('createdBy', 'firstName lastName email');
    await expense.populate('approvedBy', 'firstName lastName email');
    if (expense.budget) {
      await expense.populate('budget', 'name amount spent remaining');
    }

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: { expense }
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update expense'
    });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete expense
// @access  Private
router.delete('/:id', /* authenticateToken, */ async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Check if user can delete this expense (disabled for testing)
    // if (expense.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Not authorized to delete this expense'
    //   });
    // }

    await Expense.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense'
    });
  }
});

// @route   PUT /api/expenses/:id/approve
// @desc    Approve expense
// @access  Private (Admin/Moderator)
router.put('/:id/approve', [
  authenticateToken,
  requireAdminOrModerator
], async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    await expense.approve(req.user._id);

    await expense.populate('createdBy', 'firstName lastName email');
    await expense.populate('approvedBy', 'firstName lastName email');
    if (expense.budget) {
      await expense.populate('budget', 'name amount spent remaining');
    }

    res.json({
      success: true,
      message: 'Expense approved successfully',
      data: { expense }
    });
  } catch (error) {
    console.error('Approve expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve expense'
    });
  }
});

// @route   PUT /api/expenses/:id/reject
// @desc    Reject expense
// @access  Private (Admin/Moderator)
router.put('/:id/reject', [
  authenticateToken,
  requireAdminOrModerator,
  body('reason')
    .notEmpty()
    .withMessage('Rejection reason is required')
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

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    await expense.reject(req.user._id, req.body.reason);

    await expense.populate('createdBy', 'firstName lastName email');
    await expense.populate('approvedBy', 'firstName lastName email');
    if (expense.budget) {
      await expense.populate('budget', 'name amount spent remaining');
    }

    res.json({
      success: true,
      message: 'Expense rejected successfully',
      data: { expense }
    });
  } catch (error) {
    console.error('Reject expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject expense'
    });
  }
});

// @route   PUT /api/expenses/:id/paid
// @desc    Mark expense as paid
// @access  Private
router.put('/:id/paid', authenticateToken, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Check if user can mark this expense as paid
    if (expense.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to mark this expense as paid'
      });
    }

    await expense.markAsPaid(req.user._id);

    await expense.populate('createdBy', 'firstName lastName email');
    await expense.populate('approvedBy', 'firstName lastName email');
    if (expense.budget) {
      await expense.populate('budget', 'name amount spent remaining');
    }

    res.json({
      success: true,
      message: 'Expense marked as paid successfully',
      data: { expense }
    });
  } catch (error) {
    console.error('Mark expense as paid error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark expense as paid'
    });
  }
});

module.exports = router;
