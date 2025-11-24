const express = require('express');
const { body, validationResult, query } = require('express-validator');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Collector = require('../models/Collector');
const Truck = require('../models/Truck');
const Bin = require('../models/Bin');
const { authenticateToken, requireAdminOrModerator } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/collectors/login
// @desc    Login collector (driver)
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
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

    const { email, password } = req.body;

    // Find collector by email
    const collector = await Collector.findOne({ email }).select('+password');
    if (!collector) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if collector is active
    if (!collector.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Compare password
    const isMatch = await collector.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        collectorId: collector._id,
        email: collector.email,
        role: 'collector'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password from response
    collector.password = undefined;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        collector,
        token
      }
    });
  } catch (error) {
    console.error('Collector login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// @route   POST /api/collectors/register
// @desc    Register new collector (driver)
// @access  Private (Admin only)
router.post('/register', [
  // authenticateToken, // Temporarily disabled for testing
  // requireAdminOrModerator, // Temporarily disabled for testing
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
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ max: 20 })
    .withMessage('Phone number cannot exceed 20 characters'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('city')
    .notEmpty()
    .withMessage('City is required')
    .isLength({ max: 100 })
    .withMessage('City cannot exceed 100 characters'),
  body('driverLicense')
    .notEmpty()
    .withMessage('Driver license is required')
    .isLength({ max: 50 })
    .withMessage('Driver license cannot exceed 50 characters'),
  body('truck')
    .optional()
    .isMongoId()
    .withMessage('Invalid truck ID')
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

    const { name, email, phone, password, city, driverLicense, truck } = req.body;

    // Check if collector already exists
    const existingCollector = await Collector.findOne({
      $or: [{ email }, { driverLicense }]
    });

    if (existingCollector) {
      return res.status(400).json({
        success: false,
        message: 'Collector with this email or driver license already exists'
      });
    }

    const collectorData = {
      name,
      email,
      phone,
      password,
      city,
      driverLicense,
      status: 'active',
      currentLocation: ''
    };

    // Handle truck assignment
    if (truck) {
      const truckExists = await Truck.findById(truck);
      if (!truckExists) {
        return res.status(404).json({
          success: false,
          message: 'Truck not found'
        });
      }
      if (truckExists.assignedTo) {
        return res.status(400).json({
          success: false,
          message: 'Truck already assigned to another collector'
        });
      }
      collectorData.truck = truck;
    }

    const collector = await Collector.create(collectorData);

    // Assign truck to collector if provided
    if (truck) {
      await Truck.findByIdAndUpdate(truck, { assignedTo: collector._id });
    }

    await collector.populate('truck', 'plateNumber capacity status');

    // Remove password from response
    collector.password = undefined;

    res.status(201).json({
      success: true,
      message: 'Collector registered successfully',
      data: { collector }
    });
  } catch (error) {
    console.error('Register collector error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to register collector'
    });
  }
});

// @route   GET /api/collectors
// @desc    Get all collectors with filtering and pagination
// @access  Public (for testing)
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('city').optional().isLength({ max: 100 }).withMessage('City name too long'),
  query('status').optional().isIn(['active', 'idle', 'offline', 'on-duty']).withMessage('Invalid status')
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
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    if (city) filter.city = new RegExp(city, 'i');
    if (status) filter.status = status;

    // Search filter
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { city: new RegExp(search, 'i') },
        { driverLicense: new RegExp(search, 'i') }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const collectors = await Collector.find(filter)
      .populate('truck', 'plateNumber capacity status currentLocation')
      .populate('assignedBins', 'location city status reportedAt')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Collector.countDocuments(filter);

    res.json({
      success: true,
      data: {
        collectors,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalCollectors: total,
          hasNext: skip + collectors.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get collectors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch collectors'
    });
  }
});

// @route   GET /api/collectors/summary
// @desc    Get collector summary statistics
// @access  Public (for testing)
router.get('/summary', /* authenticateToken, */ async (req, res) => {
  try {
    const { city } = req.query;
    const filters = {};

    if (city) filters.city = new RegExp(city, 'i');

    // Get status distribution
    const statusStats = await Collector.aggregate([
      { $match: filters },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get city distribution
    const cityStats = await Collector.aggregate([
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

    // Calculate total collectors
    const totalCollectors = await Collector.countDocuments(filters);

    // Calculate performance metrics
    const performanceStats = await Collector.aggregate([
      { $match: filters },
      {
        $group: {
          _id: null,
          totalCollections: { $sum: '$performance.totalCollections' },
          totalSkipped: { $sum: '$performance.totalSkipped' },
          averageRating: { $avg: '$performance.averageRating' }
        }
      }
    ]);

    const summary = {
      totalCollectors,
      statusDistribution: statusStats,
      cityDistribution: cityStats,
      performance: performanceStats[0] || {
        totalCollections: 0,
        totalSkipped: 0,
        averageRating: 0
      }
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get collector summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch collector summary'
    });
  }
});

// @route   GET /api/collectors/:id
// @desc    Get single collector by ID
// @access  Public (for testing)
router.get('/:id', /* authenticateToken, */ async (req, res) => {
  try {
    const collector = await Collector.findById(req.params.id)
      .populate('truck', 'plateNumber capacity status currentLocation')
      .populate('assignedBins', 'location city status reportedAt');

    if (!collector) {
      return res.status(404).json({
        success: false,
        message: 'Collector not found'
      });
    }

    res.json({
      success: true,
      data: { collector }
    });
  } catch (error) {
    console.error('Get collector error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch collector'
    });
  }
});

// @route   PUT /api/collectors/:id
// @desc    Update collector
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
    .withMessage('Phone number cannot exceed 20 characters'),
  body('city')
    .optional()
    .isLength({ max: 100 })
    .withMessage('City cannot exceed 100 characters'),
  body('status')
    .optional()
    .isIn(['active', 'idle', 'offline', 'on-duty'])
    .withMessage('Invalid status'),
  body('currentLocation')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Current location cannot exceed 200 characters'),
  body('coordinates.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  body('coordinates.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude')
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

    const collector = await Collector.findById(req.params.id);

    if (!collector) {
      return res.status(404).json({
        success: false,
        message: 'Collector not found'
      });
    }

    // Update collector
    Object.assign(collector, req.body);
    
    // Update last location update timestamp if location is being updated
    if (req.body.currentLocation || req.body.coordinates) {
      collector.lastLocationUpdate = new Date();
    }
    
    await collector.save();

    await collector.populate('truck', 'plateNumber capacity status currentLocation');
    await collector.populate('assignedBins', 'location city status reportedAt');

    res.json({
      success: true,
      message: 'Collector updated successfully',
      data: { collector }
    });
  } catch (error) {
    console.error('Update collector error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update collector'
    });
  }
});

// @route   PUT /api/collectors/:id/location
// @desc    Update collector location (for drivers)
// @access  Private
router.put('/:id/location', [
  // authenticateToken, // Temporarily disabled for testing
  body('currentLocation')
    .notEmpty()
    .withMessage('Current location is required')
    .isLength({ max: 200 })
    .withMessage('Current location cannot exceed 200 characters'),
  body('coordinates.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  body('coordinates.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude')
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

    const { currentLocation, coordinates } = req.body;
    const { id } = req.params;

    const updatedCollector = await Collector.findByIdAndUpdate(
      id,
      {
        currentLocation,
        coordinates,
        lastLocationUpdate: new Date()
      },
      { new: true }
    ).populate('truck', 'plateNumber capacity status');

    if (!updatedCollector) {
      return res.status(404).json({
        success: false,
        message: 'Collector not found'
      });
    }

    // Also update truck location if assigned
    if (updatedCollector.truck) {
      await Truck.findByIdAndUpdate(updatedCollector.truck._id, {
        currentLocation,
        coordinates,
        lastLocationUpdate: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: { collector: updatedCollector }
    });
  } catch (error) {
    console.error('Update collector location error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update location'
    });
  }
});

// @route   DELETE /api/collectors/:id
// @desc    Delete collector
// @access  Private
router.delete('/:id', /* authenticateToken, */ async (req, res) => {
  try {
    const collector = await Collector.findById(req.params.id);

    if (!collector) {
      return res.status(404).json({
        success: false,
        message: 'Collector not found'
      });
    }

    // Unassign truck if assigned
    if (collector.truck) {
      await Truck.findByIdAndUpdate(collector.truck, { assignedTo: null });
    }

    // Unassign all bins
    if (collector.assignedBins.length > 0) {
      await Bin.updateMany(
        { _id: { $in: collector.assignedBins } },
        { $set: { assignedTo: null, status: 'Pending' } }
      );
    }

    await Collector.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Collector deleted successfully'
    });
  } catch (error) {
    console.error('Delete collector error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete collector'
    });
  }
});

module.exports = router;
