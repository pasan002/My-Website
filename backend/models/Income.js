const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Income title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Income amount is required'],
    min: [0.01, 'Income amount must be greater than 0']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    enum: ['LKR', 'USD', 'EUR', 'GBP'],
    default: 'LKR'
  },
  category: {
    type: String,
    required: [true, 'Income category is required'],
    enum: [
      'service_fees', 'waste_collection', 'recycling_revenue', 'government_grants',
      'donations', 'sponsorships', 'consulting', 'equipment_sales', 'rental_income',
      'penalties', 'licensing', 'training_fees', 'other'
    ]
  },
  source: {
    type: String,
    required: [true, 'Income source is required'],
    trim: true,
    maxlength: [100, 'Source cannot exceed 100 characters']
  },
  date: {
    type: Date,
    required: [true, 'Income date is required'],
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'check', 'digital_wallet', 'other'],
    default: 'bank_transfer'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'received', 'cancelled'],
    default: 'pending'
  },
  invoice: {
    number: String,
    date: Date,
    dueDate: Date,
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String
  },
  client: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Client name cannot exceed 100 characters']
    },
    contact: {
      phone: String,
      email: String,
      address: String
    },
    type: {
      type: String,
      enum: ['individual', 'business', 'government', 'ngo', 'other']
    }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  recurring: {
    isRecurring: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
    },
    nextDueDate: Date,
    endDate: Date
  },
  tax: {
    taxable: {
      type: Boolean,
      default: true
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: [0, 'Tax amount cannot be negative']
    },
    taxRate: {
      type: Number,
      default: 0,
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100%']
    }
  },
  confirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  confirmedAt: Date,
  receivedAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: [{
    text: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
incomeSchema.index({ category: 1, date: -1 });
incomeSchema.index({ status: 1, date: -1 });
incomeSchema.index({ createdBy: 1, date: -1 });
incomeSchema.index({ source: 1 });
incomeSchema.index({ 'recurring.isRecurring': 1, 'recurring.nextDueDate': 1 });

// Virtual for net income (after tax)
incomeSchema.virtual('netAmount').get(function() {
  return this.amount - this.tax.taxAmount;
});

// Virtual for formatted amount with currency
incomeSchema.virtual('formattedAmount').get(function() {
  return `${this.currency} ${this.amount.toFixed(2)}`;
});

// Virtual for formatted net amount with currency
incomeSchema.virtual('formattedNetAmount').get(function() {
  return `${this.currency} ${this.netAmount.toFixed(2)}`;
});

// Virtual for income age in days
incomeSchema.virtual('ageInDays').get(function() {
  const today = new Date();
  const incomeDate = new Date(this.date);
  const diffTime = today - incomeDate;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to calculate tax amount
incomeSchema.pre('save', function(next) {
  if (this.tax.taxable && this.tax.taxRate > 0) {
    this.tax.taxAmount = (this.amount * this.tax.taxRate) / 100;
  } else {
    this.tax.taxAmount = 0;
  }
  next();
});

// Static method to get income summary
incomeSchema.statics.getIncomeSummary = async function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalNetAmount: { $sum: { $subtract: ['$amount', '$tax.taxAmount'] } },
        totalTax: { $sum: '$tax.taxAmount' },
        incomeCount: { $sum: 1 },
        pendingAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] }
        },
        confirmedAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, '$amount', 0] }
        },
        receivedAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'received'] }, '$amount', 0] }
        }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalAmount: 0,
    totalNetAmount: 0,
    totalTax: 0,
    incomeCount: 0,
    pendingAmount: 0,
    confirmedAmount: 0,
    receivedAmount: 0
  };
};

// Static method to get income by category
incomeSchema.statics.getIncomeByCategory = async function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        totalNetAmount: { $sum: { $subtract: ['$amount', '$tax.taxAmount'] } },
        count: { $sum: 1 },
        averageAmount: { $avg: '$amount' }
      }
    },
    { $sort: { totalAmount: -1 } }
  ];

  return await this.aggregate(pipeline);
};

// Static method to get monthly income trends
incomeSchema.statics.getMonthlyTrends = async function(filters = {}, months = 12) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        totalAmount: { $sum: '$amount' },
        totalNetAmount: { $sum: { $subtract: ['$amount', '$tax.taxAmount'] } },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: months }
  ];

  return await this.aggregate(pipeline);
};

// Static method to get top income sources
incomeSchema.statics.getTopSources = async function(filters = {}, limit = 10) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: '$source',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        averageAmount: { $avg: '$amount' }
      }
    },
    { $sort: { totalAmount: -1 } },
    { $limit: limit }
  ];

  return await this.aggregate(pipeline);
};

// Instance method to confirm income
incomeSchema.methods.confirm = function(confirmedBy) {
  this.status = 'confirmed';
  this.confirmedBy = confirmedBy;
  this.confirmedAt = new Date();
  
  this.notes.push({
    text: 'Income confirmed',
    addedBy: confirmedBy,
    addedAt: new Date()
  });
  
  return this.save();
};

// Instance method to mark as received
incomeSchema.methods.markAsReceived = function(receivedBy) {
  this.status = 'received';
  this.receivedAt = new Date();
  
  this.notes.push({
    text: 'Income marked as received',
    addedBy: receivedBy,
    addedAt: new Date()
  });
  
  return this.save();
};

// Instance method to cancel income
incomeSchema.methods.cancel = function(cancelledBy, reason) {
  this.status = 'cancelled';
  
  this.notes.push({
    text: `Income cancelled: ${reason}`,
    addedBy: cancelledBy,
    addedAt: new Date()
  });
  
  return this.save();
};

// Ensure virtual fields are serialized
incomeSchema.set('toJSON', { virtuals: true });
incomeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Income', incomeSchema);
