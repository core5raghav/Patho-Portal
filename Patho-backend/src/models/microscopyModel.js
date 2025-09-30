const mongoose = require('mongoose');

const microscopySchema = new mongoose.Schema({
  reportId: {
    type: String,
    required: [true, 'Report ID is required'],
    unique: true,
    trim: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient is required']
  },
  camp: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Camp',
    required: [true, 'Camp is required']
  },
  testName: {
    type: String,
    required: [true, 'Test name is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  // Test investigations and results
  investigations: [{
    test: {
      type: String,
      required: true
    },
    result: {
      type: String,
      default: ''
    },
    unit: {
      type: String,
      required: true
    },
    bioRefInterval: {
      type: String,
      required: true
    },
    isAbnormal: {
      type: Boolean,
      default: false
    }
  }],
  // Microscopy images
  images: [{
    id: Number,
    url: String,
    title: String,
    description: String,
    magnification: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewDate: Date,
  reviewComments: String,
  rejectionReason: String,
  isActive: {
    type: Boolean,
    default: true
  },
  // Audit trail
  auditTrail: [{
    action: {
      type: String,
      required: true
    },
    user: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
microscopySchema.index({ reportId: 1 });
microscopySchema.index({ patient: 1 });
microscopySchema.index({ camp: 1 });
microscopySchema.index({ status: 1 });
microscopySchema.index({ createdBy: 1 });

// Virtual for image count
microscopySchema.virtual('imageCount').get(function() {
  return this.images ? this.images.length : 0;
});

// Method to add audit trail entry
microscopySchema.methods.addAuditEntry = function(action, user, details) {
  this.auditTrail.push({
    action,
    user,
    details,
    timestamp: new Date()
  });
  return this.save();
};

// Static method to get reports by status
microscopySchema.statics.getByStatus = function(status) {
  return this.find({ status, isActive: true })
    .populate('patient', 'name age gender')
    .populate('camp', 'name')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Microscopy', microscopySchema);