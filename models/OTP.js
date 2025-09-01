import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  otp: {
    type: String,
    required: true
  },
  attempts: {
    type: Number,
    default: 0,
    max: 7
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // 5 minutes in seconds
  }
});

// Create compound index for email and ensure single active OTP per email
otpSchema.index({ email: 1 }, { unique: true });

const OTP = mongoose.models.OTP || mongoose.model('OTP', otpSchema);

export default OTP;
