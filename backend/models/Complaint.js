const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true,
    maxlength: 20
  },
  address: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  issueType: {
    type: String,
    required: true,
    enum: ['Bin Issues', 'Transport Issues', 'Finance Issues', 'Staff Issues', 'Service Issues', 'Others']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  weight: {
    type: Number,
    min: 0,
    max: 1000
  },
  problem: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  files: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimetype: String
  }],
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'closed'],
    default: 'pending'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resolution: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  resolvedAt: {
    type: Date
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: '',
    maxlength: 1000
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Index for better query performance
complaintSchema.index({ date: -1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ issueType: 1 });
complaintSchema.index({ priority: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
