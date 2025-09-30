const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [0, 'Age cannot be negative'],
    max: [150, 'Please enter a valid age']
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['male', 'female', 'other']
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  medicalHistory: [{
    condition: String,
    diagnosed: Date,
    notes: String
  }],
  allergies: [String],
  currentMedications: [String],
  camp: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Camp',
    required: [true, 'Camp is required']
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['registered', 'examined', 'treated', 'follow-up', 'discharged'],
    default: 'registered'
  },
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
patientSchema.index({ camp: 1 });
patientSchema.index({ registrationDate: 1 });
patientSchema.index({ status: 1 });

// Virtual to populate tests
patientSchema.virtual('tests', {
  ref: 'Test',
  localField: '_id',
  foreignField: 'patient'
});

module.exports = mongoose.model('Patient', patientSchema);