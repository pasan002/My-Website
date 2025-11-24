const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event is required']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  bookingNumber: {
    type: String,
    unique: true,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partially-refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank-transfer', 'online', 'free'],
    default: 'free'
  },
  paymentDetails: {
    transactionId: {
      type: String,
      trim: true
    },
    paymentGateway: {
      type: String,
      trim: true
    },
    paidAt: {
      type: Date
    },
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'LKR'
    }
  },
  attendeeDetails: {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    dietaryRequirements: {
      type: String,
      trim: true
    },
    accessibilityNeeds: {
      type: String,
      trim: true
    },
    emergencyContact: {
      name: {
        type: String,
        trim: true
      },
      phone: {
        type: String,
        trim: true
      },
      relationship: {
        type: String,
        trim: true
      }
    }
  },
  additionalAttendees: [{
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    dietaryRequirements: {
      type: String,
      trim: true
    },
    accessibilityNeeds: {
      type: String,
      trim: true
    }
  }],
  pricing: {
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    earlyBirdDiscount: {
      type: Number,
      default: 0
    },
    groupDiscount: {
      type: Number,
      default: 0
    },
    totalDiscount: {
      type: Number,
      default: 0
    },
    finalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'LKR'
    }
  },
  specialRequests: {
    type: String,
    trim: true,
    maxlength: [500, 'Special requests cannot exceed 500 characters']
  },
  checkInStatus: {
    checkedIn: {
      type: Boolean,
      default: false
    },
    checkedInAt: {
      type: Date
    },
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  cancellationDetails: {
    cancelledAt: {
      type: Date
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      trim: true
    },
    refundAmount: {
      type: Number,
      default: 0
    },
    refundStatus: {
      type: String,
      enum: ['none', 'pending', 'processed', 'failed'],
      default: 'none'
    },
    refundProcessedAt: {
      type: Date
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  metadata: {
    source: {
      type: String,
      default: 'web'
    },
    userAgent: {
      type: String
    },
    ipAddress: {
      type: String
    }
  }
}, {
  timestamps: true
});

// Virtual for full attendee name
bookingSchema.virtual('attendeeDetails.fullName').get(function() {
  return `${this.attendeeDetails.firstName} ${this.attendeeDetails.lastName}`;
});

// Virtual for total attendees
bookingSchema.virtual('totalAttendees').get(function() {
  return 1 + this.additionalAttendees.length;
});

// Virtual for booking age
bookingSchema.virtual('bookingAge').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to generate booking number
bookingSchema.pre('save', async function(next) {
  if (!this.bookingNumber) {
    const count = await this.constructor.countDocuments();
    this.bookingNumber = `BK${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Ensure bookingNumber exists before validation runs
bookingSchema.pre('validate', function(next) {
  if (!this.bookingNumber) {
    const rnd = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.bookingNumber = `BK${Date.now()}${rnd}`;
  }
  next();
});

// Pre-save middleware to update event attendee count
bookingSchema.pre('save', async function(next) {
  if (this.isNew && this.status === 'confirmed') {
    await this.constructor.model('Event').findByIdAndUpdate(
      this.event,
      { $inc: { currentAttendees: this.totalAttendees } }
    );
  }
  next();
});

// Pre-save middleware to handle status changes
bookingSchema.pre('save', async function(next) {
  if (this.isModified('status')) {
    const Event = this.constructor.model('Event');
    
    if (this.status === 'confirmed' && this.isNew) {
      await Event.findByIdAndUpdate(
        this.event,
        { $inc: { currentAttendees: this.totalAttendees } }
      );
    } else if (this.status === 'cancelled' && this.previousStatus === 'confirmed') {
      await Event.findByIdAndUpdate(
        this.event,
        { $inc: { currentAttendees: -this.totalAttendees } }
      );
    }
  }
  next();
});

// Instance method to cancel booking
bookingSchema.methods.cancelBooking = function(reason, cancelledBy) {
  this.status = 'cancelled';
  this.cancellationDetails = {
    cancelledAt: new Date(),
    cancelledBy: cancelledBy,
    reason: reason
  };
  
  // Calculate refund based on cancellation policy
  const event = this.event;
  const now = new Date();
  const eventDate = new Date(event.date);
  const daysUntilEvent = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
  
  if (daysUntilEvent >= 7) {
    this.cancellationDetails.refundAmount = this.pricing.finalPrice;
  } else if (daysUntilEvent >= 3) {
    this.cancellationDetails.refundAmount = this.pricing.finalPrice * 0.5;
  } else {
    this.cancellationDetails.refundAmount = 0;
  }
  
  return this.save();
};

// Instance method to check in
bookingSchema.methods.checkIn = function(checkedInBy) {
  this.checkInStatus = {
    checkedIn: true,
    checkedInAt: new Date(),
    checkedInBy: checkedInBy
  };
  return this.save();
};

// Static method to get bookings by event
bookingSchema.statics.getBookingsByEvent = function(eventId) {
  return this.find({ event: eventId })
    .populate('user', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

// Static method to get bookings by user
bookingSchema.statics.getBookingsByUser = function(userId) {
  return this.find({ user: userId })
    .populate('event', 'title date location')
    .sort({ createdAt: -1 });
};

// Static method to get booking statistics
bookingSchema.statics.getBookingStats = function(eventId) {
  return this.aggregate([
    { $match: { event: mongoose.Types.ObjectId(eventId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.finalPrice' }
      }
    }
  ]);
};

// Static method to get revenue by date range
bookingSchema.statics.getRevenueByDateRange = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $in: ['confirmed', 'completed'] }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$pricing.finalPrice' },
        totalBookings: { $sum: 1 }
      }
    }
  ]);
};

// Index for better query performance
bookingSchema.index({ event: 1, status: 1 });
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ bookingNumber: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
