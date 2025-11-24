const mongoose = require('mongoose');

const binSchema = new mongoose.Schema({
  location: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  city: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
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
  status: {
    type: String,
    enum: ['Pending', 'Assigned', 'Collected', 'Skipped'],
    default: 'Pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  binType: {
    type: String,
    enum: ['household', 'commercial', 'industrial', 'recycling'],
    default: 'household'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collector',
    default: null
  },
  reportedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  assignedAt: {
    type: Date,
    default: null
  },
  collectedAt: {
    type: Date,
    default: null
  },
  skippedAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: '',
    maxlength: 500
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  images: [{
    filename: String,
    originalName: String,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for better query performance
binSchema.index({ city: 1, status: 1 });
binSchema.index({ assignedTo: 1 });
binSchema.index({ reportedAt: -1 });
binSchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('Bin', binSchema);
