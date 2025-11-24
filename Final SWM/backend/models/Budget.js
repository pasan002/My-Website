const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Budget name is required'],
    trim: true,
    maxlength: [100, 'Budget name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Budget category is required'],
    enum: [
      'operational', 'maintenance', 'equipment', 'personnel', 
      'marketing', 'utilities', 'transportation', 'waste_management',
      'emergency', 'capital', 'other'
    ]
  },
  amount: {
    type: Number,
    required: [true, 'Budget amount is required'],
    min: [0, 'Budget amount cannot be negative']
  },
  spent: {
    type: Number,
    default: 0,
    min: [0, 'Spent amount cannot be negative']
  },
  remaining: {
    type: Number,
    default: function() {
      return this.amount - this.spent;
    }
  },
  period: {
    startDate: {
      type: Date,
      required: [true, 'Budget start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'Budget end date is required']
    }
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'overdue'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: Date,
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
budgetSchema.index({ category: 1, status: 1 });
budgetSchema.index({ 'period.startDate': 1, 'period.endDate': 1 });
budgetSchema.index({ createdBy: 1 });

// Virtual for budget utilization percentage
budgetSchema.virtual('utilizationPercentage').get(function() {
  if (this.amount === 0) return 0;
  return Math.round((this.spent / this.amount) * 100);
});

// Virtual for budget status based on utilization
budgetSchema.virtual('budgetStatus').get(function() {
  const percentage = this.utilizationPercentage;
  if (percentage >= 100) return 'over_budget';
  if (percentage >= 90) return 'near_limit';
  if (percentage >= 75) return 'high_usage';
  return 'normal';
});

// Virtual for days remaining in budget period
budgetSchema.virtual('daysRemaining').get(function() {
  const today = new Date();
  const endDate = new Date(this.period.endDate);
  const diffTime = endDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// Pre-save middleware to update remaining amount
budgetSchema.pre('save', function(next) {
  this.remaining = this.amount - this.spent;
  
  // Update status based on period and utilization
  const today = new Date();
  if (this.period.endDate < today && this.status === 'active') {
    this.status = 'overdue';
  }
  
  next();
});

// Static method to get budget summary
budgetSchema.statics.getBudgetSummary = async function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: null,
        totalBudget: { $sum: '$amount' },
        totalSpent: { $sum: '$spent' },
        totalRemaining: { $sum: '$remaining' },
        budgetCount: { $sum: 1 },
        activeBudgets: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        overBudgetCount: {
          $sum: { $cond: [{ $gte: ['$spent', '$amount'] }, 1, 0] }
        }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalBudget: 0,
    totalSpent: 0,
    totalRemaining: 0,
    budgetCount: 0,
    activeBudgets: 0,
    overBudgetCount: 0
  };
};

// Static method to get budgets by category
budgetSchema.statics.getBudgetsByCategory = async function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: '$category',
        totalBudget: { $sum: '$amount' },
        totalSpent: { $sum: '$spent' },
        totalRemaining: { $sum: '$remaining' },
        count: { $sum: 1 }
      }
    },
    { $sort: { totalBudget: -1 } }
  ];

  return await this.aggregate(pipeline);
};

// Instance method to add expense to budget
budgetSchema.methods.addExpense = function(amount, description) {
  if (this.spent + amount > this.amount) {
    throw new Error('Expense would exceed budget limit');
  }
  
  this.spent += amount;
  this.remaining = this.amount - this.spent;
  
  this.notes.push({
    text: `Expense added: ${description} - Amount: ${amount}`,
    addedAt: new Date()
  });
  
  return this.save();
};

// Instance method to check if budget is over limit
budgetSchema.methods.isOverBudget = function() {
  return this.spent > this.amount;
};

// Ensure virtual fields are serialized
budgetSchema.set('toJSON', { virtuals: true });
budgetSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Budget', budgetSchema);
