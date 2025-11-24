const express = require('express');
const { body, validationResult, query } = require('express-validator');
const mongoose = require('mongoose');
const Truck = require('../models/Truck');
const Collector = require('../models/Collector');
const { authenticateToken, requireAdminOrModerator } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/trucks
// @desc    Get all trucks with filtering and pagination
// @access  Public (for testing)
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['active', 'maintenance', 'inactive', 'in-use']).withMessage('Invalid status'),
  query('fuelType').optional().isIn(['diesel', 'petrol', 'electric', 'hybrid']).withMessage('Invalid fuel type')
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
      fuelType,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    if (status) filter.status = status;
    if (fuelType) filter.fuelType = fuelType;

    // Search filter
    if (search) {
      filter.$or = [
        { plateNumber: new RegExp(search, 'i') },
        { capacity: new RegExp(search, 'i') },
        { manufacturer: new RegExp(search, 'i') },
        { model: new RegExp(search, 'i') }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const trucks = await Truck.find(filter)
      .populate('assignedTo', 'name email phone city status')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Truck.countDocuments(filter);

    res.json({
      success: true,
      data: {
        trucks,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalTrucks: total,
          hasNext: skip + trucks.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get trucks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trucks'
    });
  }
});

// @route   GET /api/trucks/summary
// @desc    Get truck summary statistics
// @access  Public (for testing)
router.get('/summary', /* authenticateToken, */ async (req, res) => {
  try {
    const { status, fuelType } = req.query;
    const filters = {};

    if (status) filters.status = status;
    if (fuelType) filters.fuelType = fuelType;

    // Get status distribution
    const statusStats = await Truck.aggregate([
      { $match: filters },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get fuel type distribution
    const fuelTypeStats = await Truck.aggregate([
      { $match: filters },
      {
        $group: {
          _id: '$fuelType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate total trucks
    const totalTrucks = await Truck.countDocuments(filters);

    // Calculate performance metrics
    const performanceStats = await Truck.aggregate([
      { $match: filters },
      {
        $group: {
          _id: null,
          totalTrips: { $sum: '$performance.totalTrips' },
          totalDistance: { $sum: '$performance.totalDistance' },
          averageFuelConsumption: { $avg: '$performance.averageFuelConsumption' }
        }
      }
    ]);

    // Get maintenance alerts
    const maintenanceAlerts = await Truck.find({
      nextMaintenance: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } // Next 30 days
    }).select('plateNumber nextMaintenance status');

    const summary = {
      totalTrucks,
      statusDistribution: statusStats,
      fuelTypeDistribution: fuelTypeStats,
      performance: performanceStats[0] || {
        totalTrips: 0,
        totalDistance: 0,
        averageFuelConsumption: 0
      },
      maintenanceAlerts
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get truck summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch truck summary'
    });
  }
});

// @route   GET /api/trucks/:id
// @desc    Get single truck by ID
// @access  Public (for testing)
router.get('/:id', /* authenticateToken, */ async (req, res) => {
  try {
    const truck = await Truck.findById(req.params.id)
      .populate('assignedTo', 'name email phone city status');

    if (!truck) {
      return res.status(404).json({
        success: false,
        message: 'Truck not found'
      });
    }

    res.json({
      success: true,
      data: { truck }
    });
  } catch (error) {
    console.error('Get truck error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch truck'
    });
  }
});

// @route   POST /api/trucks
// @desc    Create new truck
// @access  Private
router.post('/', [
  // authenticateToken, // Temporarily disabled for testing
  // requireAdminOrModerator, // Temporarily disabled for testing
  body('plateNumber')
    .notEmpty()
    .withMessage('Plate number is required')
    .isLength({ max: 20 })
    .withMessage('Plate number cannot exceed 20 characters'),
  body('capacity')
    .notEmpty()
    .withMessage('Capacity is required')
    .isLength({ max: 50 })
    .withMessage('Capacity cannot exceed 50 characters'),
  body('capacityKg')
    .optional()
    .isFloat({ min: 0, max: 50000 })
    .withMessage('Capacity in kg must be between 0 and 50000'),
  body('status')
    .optional()
    .isIn(['active', 'maintenance', 'inactive', 'in-use'])
    .withMessage('Invalid status'),
  body('fuelType')
    .optional()
    .isIn(['diesel', 'petrol', 'electric', 'hybrid'])
    .withMessage('Invalid fuel type'),
  body('fuelCapacity')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Fuel capacity must be between 0 and 1000'),
  body('manufacturer')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Manufacturer cannot exceed 100 characters'),
  body('model')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Model cannot exceed 100 characters'),
  body('year')
    .optional()
    .isInt({ min: 1990, max: new Date().getFullYear() + 1 })
    .withMessage('Invalid year')
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

    const { plateNumber, capacity, capacityKg, status, fuelType, fuelCapacity, manufacturer, model, year } = req.body;

    // Check if truck with this plate number already exists
    const existingTruck = await Truck.findOne({ plateNumber });
    if (existingTruck) {
      return res.status(400).json({
        success: false,
        message: 'Truck with this plate number already exists'
      });
    }

    const truckData = {
      plateNumber: plateNumber.toUpperCase(),
      capacity,
      capacityKg,
      status: status || 'active',
      fuelType: fuelType || 'diesel',
      fuelCapacity,
      manufacturer,
      model,
      year
    };

    const truck = await Truck.create(truckData);

    res.status(201).json({
      success: true,
      message: 'Truck created successfully',
      data: { truck }
    });
  } catch (error) {
    console.error('Create truck error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create truck'
    });
  }
});

// @route   PUT /api/trucks/:id
// @desc    Update truck
// @access  Private
router.put('/:id', [
  // authenticateToken, // Temporarily disabled for testing
  body('plateNumber')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Plate number cannot exceed 20 characters'),
  body('capacity')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Capacity cannot exceed 50 characters'),
  body('capacityKg')
    .optional()
    .isFloat({ min: 0, max: 50000 })
    .withMessage('Capacity in kg must be between 0 and 50000'),
  body('status')
    .optional()
    .isIn(['active', 'maintenance', 'inactive', 'in-use'])
    .withMessage('Invalid status'),
  body('fuelType')
    .optional()
    .isIn(['diesel', 'petrol', 'electric', 'hybrid'])
    .withMessage('Invalid fuel type'),
  body('fuelCapacity')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Fuel capacity must be between 0 and 1000'),
  body('manufacturer')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Manufacturer cannot exceed 100 characters'),
  body('model')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Model cannot exceed 100 characters'),
  body('year')
    .optional()
    .isInt({ min: 1990, max: new Date().getFullYear() + 1 })
    .withMessage('Invalid year'),
  body('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid collector ID'),
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

    const truck = await Truck.findById(req.params.id);

    if (!truck) {
      return res.status(404).json({
        success: false,
        message: 'Truck not found'
      });
    }

    // Check duplicate plate number change
    if (req.body.plateNumber && req.body.plateNumber !== truck.plateNumber) {
      const existingTruck = await Truck.findOne({ plateNumber: req.body.plateNumber.toUpperCase() });
      if (existingTruck) {
        return res.status(400).json({
          success: false,
          message: 'Truck with this plate number already exists'
        });
      }
    }

    // Update truck
    Object.assign(truck, req.body);
    
    // Update last location update timestamp if location is being updated
    if (req.body.currentLocation || req.body.coordinates) {
      truck.lastLocationUpdate = new Date();
    }

    // Handle assignedTo changes
    if (req.body.assignedTo !== undefined) {
      if (!req.body.assignedTo) {
        // Unassign truck
        if (truck.assignedTo) {
          await Collector.findByIdAndUpdate(truck.assignedTo, { truck: null });
        }
        truck.assignedTo = null;
      } else {
        // Assign to new collector
        const collector = await Collector.findById(req.body.assignedTo);
        if (!collector) {
          return res.status(404).json({
            success: false,
            message: 'Collector not found'
          });
        }

        // If collector already has a different truck
        if (collector.truck && collector.truck.toString() !== req.params.id) {
          return res.status(400).json({
            success: false,
            message: 'Collector is already assigned to another truck'
          });
        }

        // Unassign previous collector
        if (truck.assignedTo && truck.assignedTo.toString() !== req.body.assignedTo) {
          await Collector.findByIdAndUpdate(truck.assignedTo, { truck: null });
        }

        // Assign to new collector
        await Collector.findByIdAndUpdate(req.body.assignedTo, { truck: req.params.id });
        truck.assignedTo = req.body.assignedTo;
      }
    }
    
    await truck.save();

    await truck.populate('assignedTo', 'name email phone city status');

    res.json({
      success: true,
      message: 'Truck updated successfully',
      data: { truck }
    });
  } catch (error) {
    console.error('Update truck error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update truck'
    });
  }
});

// @route   PUT /api/trucks/:id/maintenance
// @desc    Update truck maintenance
// @access  Private
router.put('/:id/maintenance', [
  // authenticateToken, // Temporarily disabled for testing
  body('lastMaintenance')
    .optional()
    .isISO8601()
    .withMessage('Invalid maintenance date'),
  body('nextMaintenance')
    .optional()
    .isISO8601()
    .withMessage('Invalid next maintenance date'),
  body('mileage')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Mileage must be a positive number')
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

    const truck = await Truck.findById(req.params.id);

    if (!truck) {
      return res.status(404).json({
        success: false,
        message: 'Truck not found'
      });
    }

    // Update maintenance data
    Object.assign(truck, req.body);
    
    await truck.save();

    await truck.populate('assignedTo', 'name email phone city status');

    res.json({
      success: true,
      message: 'Truck maintenance updated successfully',
      data: { truck }
    });
  } catch (error) {
    console.error('Update truck maintenance error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update truck maintenance'
    });
  }
});

// @route   DELETE /api/trucks/:id
// @desc    Delete truck
// @access  Private
router.delete('/:id', /* authenticateToken, */ async (req, res) => {
  try {
    const truck = await Truck.findById(req.params.id);

    if (!truck) {
      return res.status(404).json({
        success: false,
        message: 'Truck not found'
      });
    }

    // Unassign collector if assigned
    if (truck.assignedTo) {
      await Collector.findByIdAndUpdate(truck.assignedTo, { truck: null });
    }

    await Truck.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Truck deleted successfully'
    });
  } catch (error) {
    console.error('Delete truck error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete truck'
    });
  }
});

module.exports = router;
