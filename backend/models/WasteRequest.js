const mongoose = require('mongoose');

const wasteRequestSchema = new mongoose.Schema({
  // User information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  mobileNumber: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true,
    match: [/^[\+]?[0-9][\d]{0,15}$/, 'Please enter a valid mobile number']
  },
  
  // Location information
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  coordinates: {
    latitude: {
      type: Number,
      min: [-90, 'Invalid latitude'],
      max: [90, 'Invalid latitude']
    },
    longitude: {
      type: Number,
      min: [-180, 'Invalid longitude'],
      max: [180, 'Invalid longitude']
    }
  },
  
  // Waste information
  type: {
    type: String,
    required: [true, 'Waste type is required'],
    enum: ['Organic', 'Recyclable', 'Other'],
    default: 'Other'
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // Pricing information
  typePrice: {
    type: Number,
    required: [true, 'Type price is required'],
    min: [0, 'Type price cannot be negative']
  },
  deliveryFee: {
    type: Number,
    required: [true, 'Delivery fee is required'],
    min: [0, 'Delivery fee cannot be negative']
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative']
  },
  
  // Request status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  // Assignment information
  assignedCollector: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collector',
    default: null
  },
  assignedTruck: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Truck',
    default: null
  },
  
  // Scheduling
  scheduledDate: {
    type: Date,
    default: null
  },
  completedDate: {
    type: Date,
    default: null
  },
  
  // Additional information
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  images: [{
    type: String // Array of image URLs/paths
  }],
  
  // Payment information
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'online', 'bank_transfer'],
    default: 'cash'
  },
  paymentReference: {
    type: String,
    trim: true
  },
  
  // Feedback
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    default: null
  },
  feedback: {
    type: String,
    trim: true,
    maxlength: [500, 'Feedback cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Index for better query performance
wasteRequestSchema.index({ user: 1 });
wasteRequestSchema.index({ status: 1 });
wasteRequestSchema.index({ type: 1 });
wasteRequestSchema.index({ scheduledDate: 1 });
wasteRequestSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });

// Virtual for full address
wasteRequestSchema.virtual('fullAddress').get(function() {
  return this.address;
});

// Pre-save middleware to calculate total price
wasteRequestSchema.pre('save', function(next) {
  if (this.isModified('typePrice') || this.isModified('deliveryFee')) {
    this.totalPrice = this.typePrice + this.deliveryFee;
  }
  next();
});

// Static method to find requests by status
wasteRequestSchema.statics.findByStatus = function(status) {
  return this.find({ status: status }).populate('user', 'firstName lastName email phone');
};

// Static method to find requests by user
wasteRequestSchema.statics.findByUser = function(userId) {
  return this.find({ user: userId }).sort({ createdAt: -1 });
};

// Static method to find requests by location
wasteRequestSchema.statics.findByLocation = function(latitude, longitude, radius = 10) {
  // This is a simplified location search - in production, you'd use MongoDB's geospatial queries
  return this.find({
    'coordinates.latitude': {
      $gte: latitude - radius,
      $lte: latitude + radius
    },
    'coordinates.longitude': {
      $gte: longitude - radius,
      $lte: longitude + radius
    }
  });
};

// Instance method to update status
wasteRequestSchema.methods.updateStatus = function(newStatus, notes = '') {
  this.status = newStatus;
  if (notes) this.notes = notes;
  
  if (newStatus === 'completed') {
    this.completedDate = new Date();
  }
  
  return this.save();
};

// Instance method to assign collector
wasteRequestSchema.methods.assignCollector = function(collectorId, truckId = null) {
  this.assignedCollector = collectorId;
  if (truckId) this.assignedTruck = truckId;
  this.status = 'confirmed';
  return this.save();
};

// Transform JSON output
wasteRequestSchema.methods.toJSON = function() {
  const requestObject = this.toObject();
  return requestObject;
};

module.exports = mongoose.model('WasteRequest', wasteRequestSchema);
