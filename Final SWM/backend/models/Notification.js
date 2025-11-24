const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  type: {
    type: String,
    required: [true, 'Notification type is required'],
    enum: [
      'event_created',
      'event_updated',
      'event_cancelled',
      'booking_confirmed',
      'booking_cancelled',
      'payment_success',
      'payment_failed',
      'reminder',
      'system',
      'promotional',
      'security',
      'welcome',
      'password_reset',
      'email_verification'
    ]
  },
  category: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'promotional'],
    default: 'info'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  actionUrl: {
    type: String,
    trim: true
  },
  actionText: {
    type: String,
    trim: true,
    maxlength: [50, 'Action text cannot exceed 50 characters']
  },
  metadata: {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },
    amount: {
      type: Number
    },
    currency: {
      type: String,
      default: 'LKR'
    },
    additionalData: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  scheduledFor: {
    type: Date
  },
  sentAt: {
    type: Date
  },
  deliveryStatus: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'bounced'],
    default: 'pending'
  },
  channels: {
    inApp: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    sms: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: false
    }
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Virtual for notification age
notificationSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for is expired
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && new Date() > this.expiresAt;
});

// Index for better query performance
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, category: 1 });
notificationSchema.index({ scheduledFor: 1, deliveryStatus: 1 });
notificationSchema.index({ expiresAt: 1 });

// Pre-save middleware to set readAt when isRead changes
notificationSchema.pre('save', function(next) {
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

// Instance method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Instance method to mark as unread
notificationSchema.methods.markAsUnread = function() {
  this.isRead = false;
  this.readAt = undefined;
  return this.save();
};

// Static method to get unread count for user
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ user: userId, isRead: false });
};

// Static method to mark all as read for user
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { user: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

// Static method to get notifications for user
notificationSchema.statics.getUserNotifications = function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    type,
    category,
    isRead,
    priority
  } = options;

  const filter = { user: userId };
  
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (isRead !== undefined) filter.isRead = isRead;
  if (priority) filter.priority = priority;

  const skip = (page - 1) * limit;

  return this.find(filter)
    .populate('metadata.eventId', 'title date location')
    .populate('metadata.bookingId', 'bookingNumber status')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to create notification
notificationSchema.statics.createNotification = function(data) {
  const notification = new this(data);
  return notification.save();
};

// Static method to send bulk notifications
notificationSchema.statics.sendBulkNotifications = function(userIds, notificationData) {
  const notifications = userIds.map(userId => ({
    ...notificationData,
    user: userId
  }));
  
  return this.insertMany(notifications);
};

// Static method to clean expired notifications
notificationSchema.statics.cleanExpired = function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

// Static method to get notification statistics
notificationSchema.statics.getStatistics = function(userId, dateFrom, dateTo) {
  const filter = { user: userId };
  
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  return this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        unread: {
          $sum: { $cond: ['$isRead', 0, 1] }
        },
        byType: {
          $push: {
            type: '$type',
            count: 1
          }
        },
        byCategory: {
          $push: {
            category: '$category',
            count: 1
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Notification', notificationSchema);
