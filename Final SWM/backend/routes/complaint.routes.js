const express = require('express');
const { body, validationResult, query } = require('express-validator');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Complaint = require('../models/Complaint');
const { authenticateToken, requireAdminOrModerator } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create uploads directory if it doesn't exist
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow images and documents only
  if (file.mimetype.startsWith('image/') || 
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/msword' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'text/plain') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, Word documents, and text files are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// @route   GET /api/complaints
// @desc    Get all complaints with filtering and pagination
// @access  Public (for testing)
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending', 'in-progress', 'resolved', 'closed']).withMessage('Invalid status'),
  query('issueType').optional().isIn(['Bin Issues', 'Transport Issues', 'Finance Issues', 'Staff Issues', 'Service Issues', 'Others']).withMessage('Invalid issue type'),
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
      limit = 10,
      status,
      issueType,
      priority,
      search,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    if (status) filter.status = status;
    if (issueType) filter.issueType = issueType;
    if (priority) filter.priority = priority;

    // Search filter
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { issueType: new RegExp(search, 'i') },
        { problem: new RegExp(search, 'i') }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const complaints = await Complaint.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Complaint.countDocuments(filter);

    res.json({
      success: true,
      data: {
        complaints,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalComplaints: total,
          hasNext: skip + complaints.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch complaints'
    });
  }
});

// @route   GET /api/complaints/summary
// @desc    Get complaint summary statistics
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

    // Get status distribution
    const statusStats = await Complaint.aggregate([
      { $match: filters },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get issue type distribution
    const issueTypeStats = await Complaint.aggregate([
      { $match: filters },
      {
        $group: {
          _id: '$issueType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get priority distribution
    const priorityStats = await Complaint.aggregate([
      { $match: filters },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate total complaints
    const totalComplaints = await Complaint.countDocuments(filters);

    const summary = {
      totalComplaints,
      statusDistribution: statusStats,
      issueTypeDistribution: issueTypeStats,
      priorityDistribution: priorityStats
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get complaint summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch complaint summary'
    });
  }
});

// @route   GET /api/complaints/:id
// @desc    Get single complaint by ID
// @access  Public (for testing)
router.get('/:id', /* authenticateToken, */ async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    res.json({
      success: true,
      data: { complaint }
    });
  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch complaint'
    });
  }
});

// @route   POST /api/complaints
// @desc    Create new complaint with file upload
// @access  Public (for testing)
router.post('/', upload.array('files', 5), [
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
  body('phone')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Phone cannot exceed 20 characters'),
  body('address')
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),
  body('issueType')
    .isIn(['Bin Issues', 'Transport Issues', 'Finance Issues', 'Staff Issues', 'Service Issues', 'Others'])
    .withMessage('Invalid issue type'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  body('weight')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Weight must be between 0 and 1000'),
  body('problem')
    .notEmpty()
    .withMessage('Problem description is required')
    .isLength({ max: 2000 })
    .withMessage('Problem description cannot exceed 2000 characters')
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

    // Handle file uploads
    const files = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    })) : [];

    const complaintData = {
      ...req.body,
      files,
      createdBy: req.user ? req.user._id : new mongoose.Types.ObjectId() // Assign a dummy user for testing if auth is off
    };

    const complaint = new Complaint(complaintData);
    await complaint.save();

    await complaint.populate('createdBy', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Complaint created successfully',
      data: { complaint }
    });
  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create complaint'
    });
  }
});

// @route   PUT /api/complaints/:id
// @desc    Update complaint
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
  body('phone')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Phone cannot exceed 20 characters'),
  body('address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),
  body('issueType')
    .optional()
    .isIn(['Bin Issues', 'Transport Issues', 'Finance Issues', 'Staff Issues', 'Service Issues', 'Others'])
    .withMessage('Invalid issue type'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  body('weight')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Weight must be between 0 and 1000'),
  body('problem')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Problem description cannot exceed 2000 characters'),
  body('status')
    .optional()
    .isIn(['pending', 'in-progress', 'resolved', 'closed'])
    .withMessage('Invalid status'),
  body('resolution')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Resolution cannot exceed 1000 characters'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
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

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Check if user can update this complaint (disabled for testing)
    // if (complaint.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Not authorized to update this complaint'
    //   });
    // }

    // Update complaint
    Object.assign(complaint, req.body);
    
    // If status is being changed to resolved, set resolvedAt
    if (req.body.status === 'resolved' && complaint.status !== 'resolved') {
      complaint.resolvedAt = new Date();
    }
    
    await complaint.save();

    await complaint.populate('createdBy', 'firstName lastName email');
    await complaint.populate('assignedTo', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Complaint updated successfully',
      data: { complaint }
    });
  } catch (error) {
    console.error('Update complaint error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update complaint'
    });
  }
});

// @route   DELETE /api/complaints/:id
// @desc    Delete complaint
// @access  Private
router.delete('/:id', /* authenticateToken, */ async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Check if user can delete this complaint (disabled for testing)
    // if (complaint.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Not authorized to delete this complaint'
    //   });
    // }

    // Delete associated files
    if (complaint.files && complaint.files.length > 0) {
      complaint.files.forEach(file => {
        const filePath = path.join(__dirname, '../uploads', file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    await Complaint.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Complaint deleted successfully'
    });
  } catch (error) {
    console.error('Delete complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete complaint'
    });
  }
});

// @route   PUT /api/complaints/:id/status
// @desc    Update complaint status
// @access  Private (Admin/Moderator)
router.put('/:id/status', [
  // authenticateToken, // Temporarily disabled for testing
  // requireAdminOrModerator, // Temporarily disabled for testing
  body('status')
    .isIn(['pending', 'in-progress', 'resolved', 'closed'])
    .withMessage('Invalid status. Must be one of: pending, in-progress, resolved, closed')
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

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    complaint.status = req.body.status;
    
    // If status is being changed to resolved, set resolvedAt
    if (req.body.status === 'resolved' && complaint.status !== 'resolved') {
      complaint.resolvedAt = new Date();
    }
    
    await complaint.save();

    await complaint.populate('createdBy', 'firstName lastName email');
    await complaint.populate('assignedTo', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Complaint status updated successfully',
      data: { complaint }
    });
  } catch (error) {
    console.error('Update complaint status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update complaint status'
    });
  }
});

// @route   PUT /api/complaints/:id/notes
// @desc    Update complaint notes
// @access  Private (Admin/Moderator)
router.put('/:id/notes', [
  // authenticateToken, // Temporarily disabled for testing
  // requireAdminOrModerator, // Temporarily disabled for testing
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
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

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    complaint.notes = req.body.notes || '';
    await complaint.save();

    await complaint.populate('createdBy', 'firstName lastName email');
    await complaint.populate('assignedTo', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Complaint notes updated successfully',
      data: { complaint }
    });
  } catch (error) {
    console.error('Update complaint notes error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update complaint notes'
    });
  }
});

module.exports = router;
