const mongoose = require('mongoose');

const truckSchema = new mongoose.Schema({
  plateNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: 20
  },
  capacity: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  capacityKg: {
    type: Number,
    min: 0,
    max: 50000
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'inactive', 'in-use'],
    default: 'active'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collector',
    default: null
  },
  currentLocation: {
    type: String,
    default: ''
  },
  coordinates: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    }
  },
  lastLocationUpdate: {
    type: Date,
    default: null
  },
  lastMaintenance: {
    type: Date,
    default: Date.now
  },
  nextMaintenance: {
    type: Date,
    default: function() {
      const nextDate = new Date();
      nextDate.setMonth(nextDate.getMonth() + 3); // 3 months from now
      return nextDate;
    }
  },
  fuelType: {
    type: String,
    enum: ['diesel', 'petrol', 'electric', 'hybrid'],
    default: 'diesel'
  },
  fuelCapacity: {
    type: Number,
    min: 0,
    max: 1000
  },
  mileage: {
    type: Number,
    min: 0,
    default: 0
  },
  manufacturer: {
    type: String,
    trim: true,
    maxlength: 100
  },
  model: {
    type: String,
    trim: true,
    maxlength: 100
  },
  year: {
    type: Number,
    min: 1990,
    max: new Date().getFullYear() + 1
  },
  insuranceExpiry: {
    type: Date
  },
  registrationExpiry: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  performance: {
    totalTrips: {
      type: Number,
      default: 0
    },
    totalDistance: {
      type: Number,
      default: 0
    },
    averageFuelConsumption: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for better query performance
truckSchema.index({ plateNumber: 1 });
truckSchema.index({ status: 1 });
truckSchema.index({ assignedTo: 1 });
truckSchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('Truck', truckSchema);
