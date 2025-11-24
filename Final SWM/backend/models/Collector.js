const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const collectorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  city: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  status: {
    type: String,
    enum: ['active', 'idle', 'offline', 'on-duty'],
    default: 'active'
  },
  truck: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Truck',
    default: null
  },
  assignedBins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bin'
  }],
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
  driverLicense: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  hireDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  performance: {
    totalCollections: {
      type: Number,
      default: 0
    },
    totalSkipped: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
collectorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
collectorSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Index for better query performance
collectorSchema.index({ email: 1 });
collectorSchema.index({ city: 1, status: 1 });
collectorSchema.index({ driverLicense: 1 });
collectorSchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('Collector', collectorSchema);
