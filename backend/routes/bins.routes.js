const express = require('express');
const { body, validationResult, query } = require('express-validator');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Bin = require('../models/Bin');
const Collector = require('../models/Collector');
const { authenticateToken, requireAdminOrModerator } = require('../middleware/auth');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/bins/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// @route   GET /api/bins
// @desc    Get all bins with filtering and pagination
// @access  Public (for testing)
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('city').optional().isLength({ max: 100 }).withMessage('City name too long'),
  query('status').optional().isIn(['Pending', 'Assigned', 'Collected', 'Skipped']).withMessage('Invalid status'),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  query('binType').optional().isIn(['household', 'commercial', 'industrial', 'recycling']).withMessage('Invalid bin type')
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
      city,
      status,
      priority,
      binType,
      search,
      sortBy = 'reportedAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    if (city) filter.city = new RegExp(city, 'i');
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (binType) filter.binType = binType;

    // Search filter
    if (search) {
      filter.$or = [
        { location: new RegExp(search, 'i') },
        { city: new RegExp(search, 'i') },
        { notes: new RegExp(search, 'i') }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const bins = await Bin.find(filter)
      .populate('assignedTo', 'name email phone city status')
      .populate('reportedBy', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Bin.countDocuments(filter);

    res.json({
      success: true,
      data: {
        bins,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalBins: total,
          hasNext: skip + bins.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get bins error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bins'
    });
  }
});

// @route   GET /api/bins/summary
// @desc    Get bin summary statistics
// @access  Public (for testing)
router.get('/summary', /* authenticateToken, */ async (req, res) => {
  try {
    const { city, dateFrom, dateTo } = req.query;
    const filters = {};

    if (city) filters.city = new RegExp(city, 'i');
    if (dateFrom || dateTo) {
      filters.reportedAt = {};
      if (dateFrom) filters.reportedAt.$gte = new Date(dateFrom);
      if (dateTo) filters.reportedAt.$lte = new Date(dateTo);
    }

    // Get status distribution
    const statusStats = await Bin.aggregate([
      { $match: filters },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get city distribution
    const cityStats = await Bin.aggregate([
      { $match: filters },
      {
        $group: {
          _id: '$city',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get priority distribution
    const priorityStats = await Bin.aggregate([
      { $match: filters },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate total bins
    const totalBins = await Bin.countDocuments(filters);

    const summary = {
      totalBins,
      statusDistribution: statusStats,
      cityDistribution: cityStats,
      priorityDistribution: priorityStats
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get bin summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bin summary'
    });
  }
});

// @route   GET /api/bins/collector/:collectorId
// @desc    Get bins assigned to specific collector
// @access  Public (for testing)
router.get('/collector/:collectorId', /* authenticateToken, */ async (req, res) => {
  try {
    const { collectorId } = req.params;
    
    const collector = await Collector.findById(collectorId);
    if (!collector) {
      return res.status(404).json({
        success: false,
        message: 'Collector not found'
      });
    }

    const bins = await Bin.find({ assignedTo: collectorId })
      .populate('assignedTo', 'name email phone city status')
      .populate('reportedBy', 'firstName lastName email')
      .sort({ reportedAt: -1 });

    res.json({
      success: true,
      data: {
        bins,
        collector: {
          _id: collector._id,
          name: collector.name,
          city: collector.city,
          status: collector.status
        }
      }
    });
  } catch (error) {
    console.error('Get bins by collector error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bins for collector'
    });
  }
});

// @route   GET /api/bins/:id
// @desc    Get single bin by ID
// @access  Public (for testing)
router.get('/:id', /* authenticateToken, */ async (req, res) => {
  try {
    const bin = await Bin.findById(req.params.id)
      .populate('assignedTo', 'name email phone city status')
      .populate('reportedBy', 'firstName lastName email');

    if (!bin) {
      return res.status(404).json({
        success: false,
        message: 'Bin not found'
      });
    }

    res.json({
      success: true,
      data: { bin }
    });
  } catch (error) {
    console.error('Get bin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bin'
    });
  }
});

// @route   POST /api/bins
// @desc    Create new bin
// @access  Public (for testing)
router.post('/', upload.array('images', 5), [
  // authenticateToken, // Temporarily disabled for testing
  body('location')
    .notEmpty()
    .withMessage('Location is required')
    .isLength({ max: 200 })
    .withMessage('Location cannot exceed 200 characters'),
  body('city')
    .notEmpty()
    .withMessage('City is required')
    .isLength({ max: 100 })
    .withMessage('City cannot exceed 100 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  body('binType')
    .optional()
    .isIn(['household', 'commercial', 'industrial', 'recycling'])
    .withMessage('Invalid bin type'),
  body('coordinates.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  body('coordinates.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
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

    // Handle image uploads
    const images = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      uploadedAt: new Date()
    })) : [];

    const binData = {
      ...req.body,
      images,
      reportedBy: req.user ? req.user._id : new mongoose.Types.ObjectId() // Assign a dummy user for testing if auth is off
    };

    const bin = new Bin(binData);
    await bin.save();

    await bin.populate('reportedBy', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Bin created successfully',
      data: { bin }
    });
  } catch (error) {
    console.error('Create bin error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create bin'
    });
  }
});

// @route   PUT /api/bins/:id
// @desc    Update bin
// @access  Private
router.put('/:id', [
  // authenticateToken, // Temporarily disabled for testing
  body('location')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Location cannot exceed 200 characters'),
  body('city')
    .optional()
    .isLength({ max: 100 })
    .withMessage('City cannot exceed 100 characters'),
  body('status')
    .optional()
    .isIn(['Pending', 'Assigned', 'Collected', 'Skipped'])
    .withMessage('Invalid status'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  body('binType')
    .optional()
    .isIn(['household', 'commercial', 'industrial', 'recycling'])
    .withMessage('Invalid bin type'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
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

    const bin = await Bin.findById(req.params.id);

    if (!bin) {
      return res.status(404).json({
        success: false,
        message: 'Bin not found'
      });
    }

    // Update bin
    Object.assign(bin, req.body);
    
    // Update timestamps based on status changes
    if (req.body.status === 'Collected' && bin.status !== 'Collected') {
      bin.collectedAt = new Date();
    } else if (req.body.status === 'Skipped' && bin.status !== 'Skipped') {
      bin.skippedAt = new Date();
    }
    
    await bin.save();

    await bin.populate('assignedTo', 'name email phone city status');
    await bin.populate('reportedBy', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Bin updated successfully',
      data: { bin }
    });
  } catch (error) {
    console.error('Update bin error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update bin'
    });
  }
});

// @route   PUT /api/bins/:binId/status
// @desc    Update bin status (for drivers)
// @access  Private
router.put('/:binId/status', [
  // authenticateToken, // Temporarily disabled for testing
  body('status')
    .isIn(['Pending', 'Assigned', 'Collected', 'Skipped'])
    .withMessage('Invalid status'),
  body('collectorId')
    .optional()
    .isMongoId()
    .withMessage('Invalid collector ID')
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

    const { status, collectorId } = req.body;
    const { binId } = req.params;

    const bin = await Bin.findById(binId).populate('assignedTo', 'name email phone city status');
    if (!bin) {
      return res.status(404).json({
        success: false,
        message: 'Bin not found'
      });
    }

    // Check if collector is assigned to this bin (if collectorId provided)
    if (collectorId && bin.assignedTo && bin.assignedTo._id.toString() !== collectorId) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this bin'
      });
    }

    const updatedBin = await Bin.findByIdAndUpdate(
      binId,
      {
        status,
        ...(status === 'Collected' && { collectedAt: new Date() }),
        ...(status === 'Skipped' && { skippedAt: new Date() })
      },
      { new: true }
    ).populate('assignedTo', 'name email phone city status');

    // Remove from collector's assigned bins if completed
    if (updatedBin.assignedTo && (status === 'Collected' || status === 'Skipped')) {
      await Collector.findByIdAndUpdate(updatedBin.assignedTo._id, {
        $pull: { assignedBins: updatedBin._id }
      });
    }

    res.json({
      success: true,
      message: 'Bin status updated successfully',
      data: { bin: updatedBin }
    });
  } catch (error) {
    console.error('Update bin status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update bin status'
    });
  }
});

// @route   PUT /api/bins/:id/assign-collector
// @desc    Assign collector to bin
// @access  Private
router.put('/:id/assign-collector', [
  // authenticateToken, // Temporarily disabled for testing
  // requireAdminOrModerator, // Temporarily disabled for testing
  body('collectorId')
    .isMongoId()
    .withMessage('Invalid collector ID')
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

    const { collectorId } = req.body;
    const collector = await Collector.findById(collectorId);
    if (!collector) {
      return res.status(404).json({
        success: false,
        message: 'Collector not found'
      });
    }

    const bin = await Bin.findByIdAndUpdate(
      req.params.id,
      { assignedTo: collectorId, status: 'Assigned', assignedAt: new Date() },
      { new: true }
    ).populate('assignedTo', 'name email phone city status');

    if (!bin) {
      return res.status(404).json({
        success: false,
        message: 'Bin not found'
      });
    }

    // Add to collector's assigned bins if not already there
    if (!collector.assignedBins.includes(bin._id)) {
      collector.assignedBins.push(bin._id);
      await collector.save();
    }

    res.json({
      success: true,
      message: 'Collector assigned successfully',
      data: { bin }
    });
  } catch (error) {
    console.error('Assign collector error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to assign collector'
    });
  }
});

// @route   DELETE /api/bins/:id
// @desc    Delete bin
// @access  Private
router.delete('/:id', /* authenticateToken, */ async (req, res) => {
  try {
    const bin = await Bin.findById(req.params.id);

    if (!bin) {
      return res.status(404).json({
        success: false,
        message: 'Bin not found'
      });
    }

    // Remove from collector's assigned bins
    if (bin.assignedTo) {
      await Collector.findByIdAndUpdate(bin.assignedTo, {
        $pull: { assignedBins: bin._id }
      });
    }

    // Delete associated images
    if (bin.images && bin.images.length > 0) {
      bin.images.forEach(image => {
        const filePath = path.join(__dirname, '../uploads/bins', image.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    await Bin.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Bin deleted successfully'
    });
  } catch (error) {
    console.error('Delete bin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete bin'
    });
  }
});

module.exports = router;
