const express = require('express');
const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const WasteRequest = require('../models/WasteRequest');
const User = require('../models/User');
const Bin = require('../models/Bin');
const { requireAdminOrModerator } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/user-management/overview
// @desc    Get user management overview
// @access  Private
router.get('/overview', /* authenticateToken, */ async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalRequests,
      pendingRequests,
      completedRequests
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      WasteRequest.countDocuments(),
      WasteRequest.countDocuments({ status: 'pending' }),
      WasteRequest.countDocuments({ status: 'completed' })
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalRequests,
        pendingRequests,
        completedRequests
      }
    });
  } catch (error) {
    console.error('Get overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overview data'
    });
  }
});

// @route   GET /api/user-management/requests
// @desc    Get waste collection requests
// @access  Private
router.get('/requests', /* authenticateToken, */ async (req, res) => {
  try {
    const { status, user, page = 1, limit = 10 } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (user) filter.user = user;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const requests = await WasteRequest.find(filter)
      .populate('user', 'firstName lastName email phone')
      .populate('assignedCollector', 'name email phone')
      .populate('assignedTruck', 'plateNumber capacity')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await WasteRequest.countDocuments(filter);

    res.json({
      success: true,
      data: {
        requests,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalRequests: total,
          hasNext: skip + requests.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch requests'
    });
  }
});

// @route   POST /api/user-management/requests
// @desc    Create waste collection request
// @access  Private
router.post('/requests', [
  // authenticateToken,
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('mobileNumber').notEmpty().withMessage('Mobile number is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('type').isIn(['Organic', 'Recyclable', 'Other']).withMessage('Invalid waste type'),
  body('description').notEmpty().withMessage('Description is required'),
  body('typePrice').isNumeric().withMessage('Type price must be a number'),
  body('deliveryFee').isNumeric().withMessage('Delivery fee must be a number'),
  body('coordinates.latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('coordinates.longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude')
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

    const requestData = {
      ...req.body,
      user: req.user ? req.user._id : null,
      totalPrice: parseFloat(req.body.typePrice) + parseFloat(req.body.deliveryFee)
    };

    const wasteRequest = new WasteRequest(requestData);
    await wasteRequest.save();

    await wasteRequest.populate('user', 'firstName lastName email phone');

    res.status(201).json({
      success: true,
      message: 'Waste collection request created successfully',
      data: { request: wasteRequest }
    });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create request'
    });
  }
});

// @route   GET /api/user-management/requests/:id
// @desc    Get single waste collection request
// @access  Private
router.get('/requests/:id', authenticateToken, async (req, res) => {
  try {
    const request = await WasteRequest.findById(req.params.id)
      .populate('user', 'firstName lastName email phone')
      .populate('assignedCollector', 'name email phone')
      .populate('assignedTruck', 'plateNumber capacity');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check if user can view this request
    if (request.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this request'
      });
    }

    res.json({
      success: true,
      data: { request }
    });
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch request'
    });
  }
});

// @route   PUT /api/user-management/requests/:id
// @desc    Update waste collection request
// @access  Private
router.put('/requests/:id', [
  authenticateToken,
  body('status').optional().isIn(['pending', 'confirmed', 'in-progress', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('feedback').optional().isLength({ max: 500 }).withMessage('Feedback cannot exceed 500 characters')
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

    const request = await WasteRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check if user can update this request
    if (request.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this request'
      });
    }

    // Update request
    Object.assign(request, req.body);
    await request.save();

    await request.populate('user', 'firstName lastName email phone');
    await request.populate('assignedCollector', 'name email phone');
    await request.populate('assignedTruck', 'plateNumber capacity');

    res.json({
      success: true,
      message: 'Request updated successfully',
      data: { request }
    });
  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update request'
    });
  }
});

// @route   DELETE /api/user-management/requests/:id
// @desc    Delete waste collection request
// @access  Private
router.delete('/requests/:id', authenticateToken, async (req, res) => {
  try {
    const request = await WasteRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check if user can delete this request
    if (request.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this request'
      });
    }

    await WasteRequest.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Request deleted successfully'
    });
  } catch (error) {
    console.error('Delete request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete request'
    });
  }
});

// @route   PUT /api/user-management/requests/:id/approve
// @desc    Approve a waste collection request and create a transport bin task
// @access  Admin/Moderator
router.put('/requests/:id/approve', [/* authenticateToken, */ /* requireAdminOrModerator */], async (req, res) => {
  try {
    const request = await WasteRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Update request status
    request.status = 'confirmed';
    if (req.body?.notes) request.notes = req.body.notes;
    await request.save();

    // Create a Bin entry to be visible in Transport dashboard
    const cityGuess = (request.address || '')
      .split(',')
      .map(p => p.trim())
      .filter(Boolean)
      .pop() || 'Unknown';

    const binDoc = new Bin({
      location: request.address,
      city: cityGuess,
      status: 'Pending',
      priority: 'medium',
      binType: request.type === 'Recyclable' ? 'recycling' : 'household',
      coordinates: request.coordinates?.latitude && request.coordinates?.longitude ? {
        latitude: request.coordinates.latitude,
        longitude: request.coordinates.longitude
      } : undefined,
      notes: `Created from waste request ${request._id}`,
      reportedBy: request.user || undefined
    });

    await binDoc.save();

    res.json({
      success: true,
      message: 'Request approved and transport task created',
      data: {
        request,
        bin: binDoc
      }
    });
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve request' });
  }
});

// @route   PUT /api/user-management/requests/:id/reject
// @desc    Reject a waste collection request (delete it)
// @access  Admin/Moderator
router.put('/requests/:id/reject', [/* authenticateToken, */ /* requireAdminOrModerator */], async (req, res) => {
  try {
    const request = await WasteRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Delete the request instead of just marking as cancelled
    await WasteRequest.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Request rejected and removed successfully',
      data: { deletedRequestId: req.params.id }
    });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject request' });
  }
});

module.exports = router;
