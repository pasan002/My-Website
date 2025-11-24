const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Budget = require('../models/Budget');
const { authenticateToken, requireAdminOrModerator } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/budgets
// @desc    Get all budgets with filtering and pagination
// @access  Private
router.get('/', [
  // authenticateToken, // Temporarily disabled for testing
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isIn([
    'operational', 'maintenance', 'equipment', 'personnel', 
    'marketing', 'utilities', 'transportation', 'waste_management',
    'emergency', 'capital', 'other'
  ]).withMessage('Invalid category'),
  query('status').optional().isIn(['active', 'completed', 'cancelled', 'overdue']).withMessage('Invalid status'),
  query('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority')
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
      priority,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    if (category) filter.category = category;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    // Search filter
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const budgets = await Budget.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Budget.countDocuments(filter);

    res.json({
      success: true,
      data: {
        budgets,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalBudgets: total,
          hasNext: skip + budgets.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch budgets'
    });
  }
});

// @route   GET /api/budgets/summary
// @desc    Get budget summary statistics
// @access  Private
router.get('/summary', /* authenticateToken, */ async (req, res) => {
  try {
    const summary = await Budget.getBudgetSummary();
    const categoryBreakdown = await Budget.getBudgetsByCategory();

    res.json({
      success: true,
      data: {
        summary,
        categoryBreakdown
      }
    });
  } catch (error) {
    console.error('Get budget summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch budget summary'
    });
  }
});

// @route   GET /api/budgets/:id
// @desc    Get single budget by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email');

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    res.json({
      success: true,
      data: { budget }
    });
  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch budget'
    });
  }
});

// @route   POST /api/budgets
// @desc    Create new budget
// @access  Private
router.post('/', [
  authenticateToken,
  body('name')
    .notEmpty()
    .withMessage('Budget name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('category')
    .isIn([
      'operational', 'maintenance', 'equipment', 'personnel', 
      'marketing', 'utilities', 'transportation', 'waste_management',
      'emergency', 'capital', 'other'
    ])
    .withMessage('Invalid category'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('period.startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('period.endDate')
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.period.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
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

    const budgetData = {
      ...req.body,
      createdBy: req.user._id
    };

    const budget = new Budget(budgetData);
    await budget.save();

    await budget.populate('createdBy', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      data: { budget }
    });
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create budget'
    });
  }
});

// @route   PUT /api/budgets/:id
// @desc    Update budget
// @access  Private
router.put('/:id', [
  authenticateToken,
  body('name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
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

    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    // Check if user can update this budget
    if (budget.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this budget'
      });
    }

    // Update budget
    Object.assign(budget, req.body);
    await budget.save();

    await budget.populate('createdBy', 'firstName lastName email');
    await budget.populate('approvedBy', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Budget updated successfully',
      data: { budget }
    });
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update budget'
    });
  }
});

// @route   DELETE /api/budgets/:id
// @desc    Delete budget
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    // Check if user can delete this budget
    if (budget.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this budget'
      });
    }

    await Budget.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Budget deleted successfully'
    });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete budget'
    });
  }
});

// @route   PUT /api/budgets/:id/approve
// @desc    Approve budget
// @access  Private (Admin/Moderator)
router.put('/:id/approve', [
  authenticateToken,
  requireAdminOrModerator
], async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    budget.approvedBy = req.user._id;
    budget.approvalDate = new Date();
    
    budget.notes.push({
      text: 'Budget approved',
      addedBy: req.user._id,
      addedAt: new Date()
    });

    await budget.save();

    await budget.populate('createdBy', 'firstName lastName email');
    await budget.populate('approvedBy', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Budget approved successfully',
      data: { budget }
    });
  } catch (error) {
    console.error('Approve budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve budget'
    });
  }
});

// @route   PUT /api/budgets/:id/status
// @desc    Update budget status
// @access  Private
router.put('/:id/status', [
  authenticateToken,
  body('status')
    .isIn(['active', 'completed', 'cancelled', 'overdue'])
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

    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    // Check if user can update this budget
    if (budget.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this budget'
      });
    }

    budget.status = status;
    
    budget.notes.push({
      text: `Budget status changed to ${status}`,
      addedBy: req.user._id,
      addedAt: new Date()
    });

    await budget.save();

    res.json({
      success: true,
      message: 'Budget status updated successfully',
      data: { budget }
    });
  } catch (error) {
    console.error('Update budget status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update budget status'
    });
  }
});

module.exports = router;
