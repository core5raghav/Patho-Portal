const mongoose = require('mongoose');
const config = require('../config/config');

const testSchema = new mongoose.Schema({
  testName: {
    type: String,
    required: [true, 'Test name is required'],
    trim: true
  },
  testType: {
    type: String,
    required: [true, 'Test type is required'],
    enum: ['blood', 'urine', 'x-ray', 'ecg', 'ultrasound', 'bmi', 'blood-pressure', 'other']
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
  conductedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Test conductor is required']
  },
  testDate: {
    type: Date,
    default: Date.now,
    required: [true, 'Test date is required']
  },
  result: {
    type: String,
    enum: Object.values(config.testResults),
    default: config.testResults.PENDING
  },
  values: {
    numeric: [{
      parameter: String,
      value: Number,
      unit: String,
      normalRange: String,
      isNormal: Boolean
    }],
    text: [{
      parameter: String,
      value: String,
      notes: String
    }]
  },
  findings: {
    type: String,
    trim: true
  },
  recommendations: {
    type: String,
    trim: true
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  attachments: [{
    filename: String,
    url: String,
    description: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewDate: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  notes: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
testSchema.index({ patient: 1 });
testSchema.index({ camp: 1 });
testSchema.index({ testDate: 1 });
testSchema.index({ result: 1 });
testSchema.index({ testType: 1 });

// Virtual for test status
testSchema.virtual('status').get(function() {
  if (this.result === config.testResults.PENDING) {
    return 'pending';
  } else if (this.result === config.testResults.NORMAL) {
    return 'completed';
  } else {
    return 'completed';
  }
});

// Static method to get test statistics
testSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $group: {
        _id: '$result',
        count: { $sum: 1 }
      }
    }
  ]);
  
  return stats;
};

module.exports = mongoose.model('Test', testSchema);