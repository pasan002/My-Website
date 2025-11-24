const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Expense title is required'],
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
    required: [true, 'Expense amount is required'],
    min: [0.01, 'Expense amount must be greater than 0']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    enum: ['LKR', 'USD', 'EUR', 'GBP'],
    default: 'LKR'
  },
  category: {
    type: String,
    required: [true, 'Expense category is required'],
    enum: [
      'fuel', 'maintenance', 'equipment', 'personnel', 'utilities',
      'office_supplies', 'transportation', 'waste_disposal', 'repairs',
      'insurance', 'legal', 'marketing', 'training', 'emergency', 'other'
    ]
  },
  subcategory: {
    type: String,
    trim: true,
    maxlength: [50, 'Subcategory cannot exceed 50 characters']
  },
  date: {
    type: Date,
    required: [true, 'Expense date is required'],
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'check', 'digital_wallet', 'other'],
    default: 'cash'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid'],
    default: 'pending'
  },
  receipt: {
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String
  },
  vendor: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Vendor name cannot exceed 100 characters']
    },
    contact: {
      phone: String,
      email: String,
      address: String
    }
  },
  budget: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Budget'
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
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectionReason: String,
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
expenseSchema.index({ category: 1, date: -1 });
expenseSchema.index({ status: 1, date: -1 });
expenseSchema.index({ createdBy: 1, date: -1 });
expenseSchema.index({ budget: 1 });
expenseSchema.index({ 'recurring.isRecurring': 1, 'recurring.nextDueDate': 1 });

// Virtual for expense age in days
expenseSchema.virtual('ageInDays').get(function() {
  const today = new Date();
  const expenseDate = new Date(this.date);
  const diffTime = today - expenseDate;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for formatted amount with currency
expenseSchema.virtual('formattedAmount').get(function() {
  return `${this.currency} ${this.amount.toFixed(2)}`;
});

// Pre-save middleware to validate budget allocation
expenseSchema.pre('save', async function(next) {
  if (this.budget && this.isModified('amount')) {
    const Budget = mongoose.model('Budget');
    const budget = await Budget.findById(this.budget);
    
    if (budget) {
      // Check if expense would exceed budget
      const totalExpenses = await this.constructor.aggregate([
        { $match: { budget: this.budget, _id: { $ne: this._id } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      
      const currentTotal = totalExpenses[0]?.total || 0;
      if (currentTotal + this.amount > budget.amount) {
        return next(new Error('Expense would exceed budget limit'));
      }
    }
  }
  
  next();
});

// Static method to get expense summary
expenseSchema.statics.getExpenseSummary = async function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        expenseCount: { $sum: 1 },
        pendingAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] }
        },
        approvedAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0] }
        },
        paidAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] }
        }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalAmount: 0,
    expenseCount: 0,
    pendingAmount: 0,
    approvedAmount: 0,
    paidAmount: 0
  };
};

// Static method to get expenses by category
expenseSchema.statics.getExpensesByCategory = async function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        averageAmount: { $avg: '$amount' }
      }
    },
    { $sort: { totalAmount: -1 } }
  ];

  return await this.aggregate(pipeline);
};

// Static method to get monthly expense trends
expenseSchema.statics.getMonthlyTrends = async function(filters = {}, months = 12) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: months }
  ];

  return await this.aggregate(pipeline);
};

// Instance method to approve expense
expenseSchema.methods.approve = function(approvedBy) {
  this.status = 'approved';
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  
  this.notes.push({
    text: 'Expense approved',
    addedBy: approvedBy,
    addedAt: new Date()
  });
  
  return this.save();
};

// Instance method to reject expense
expenseSchema.methods.reject = function(rejectedBy, reason) {
  this.status = 'rejected';
  this.rejectionReason = reason;
  
  this.notes.push({
    text: `Expense rejected: ${reason}`,
    addedBy: rejectedBy,
    addedAt: new Date()
  });
  
  return this.save();
};

// Instance method to mark as paid
expenseSchema.methods.markAsPaid = function(paidBy) {
  this.status = 'paid';
  
  this.notes.push({
    text: 'Expense marked as paid',
    addedBy: paidBy,
    addedAt: new Date()
  });
  
  return this.save();
};

// Ensure virtual fields are serialized
expenseSchema.set('toJSON', { virtuals: true });
expenseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Expense', expenseSchema);
