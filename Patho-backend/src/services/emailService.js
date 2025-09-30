const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../utils/logger');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465, // true for 465, false for other ports
    auth: {
      user: config.email.user,
      pass: config.email.password
    },
    // For development, you can use these settings to test with Ethereal Email
    // host: 'smtp.ethereal.email',
    // port: 587,
    // auth: {
    //   user: 'ethereal.username@ethereal.email',
    //   pass: 'ethereal.password'
    // }
  });
};

// Send email function
const sendEmail = async ({ email, subject, message, html }) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: config.email.from || 'noreply@healthcamp.com',
      to: email,
      subject,
      text: message,
      html: html || message
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    logger.info(`Email sent successfully to ${email}`, {
      messageId: info.messageId,
      subject
    });
    
    return info;
  } catch (error) {
    logger.error('Email sending failed:', error);
    throw new Error('Failed to send email');
  }
};

// Send welcome email
const sendWelcomeEmail = async (user) => {
  const subject = 'Welcome to Health Camp Management System';
  const message = `
    Hello ${user.name},
    
    Welcome to our Health Camp Management System!
    
    Your account has been created successfully with the email: ${user.email}
    
    Please verify your email address to complete your registration.
    
    Best regards,
    Health Camp Team
  `;
  
  return sendEmail({
    email: user.email,
    subject,
    message
  });
};

// Send password reset email
const sendPasswordResetEmail = async (user, resetURL) => {
  const subject = 'Password Reset - Health Camp System';
  const message = `
    Hello ${user.name},
    
    You requested a password reset for your Health Camp account.
    
    Please click the link below to reset your password:
    ${resetURL}
    
    This link will expire in 10 minutes.
    
    If you did not request this reset, please ignore this email.
    
    Best regards,
    Health Camp Team
  `;
  
  return sendEmail({
    email: user.email,
    subject,
    message
  });
};

// Send email verification
const sendVerificationEmail = async (user, verificationURL) => {
  const subject = 'Email Verification - Health Camp System';
  const message = `
    Hello ${user.name},
    
    Please verify your email address by clicking the link below:
    ${verificationURL}
    
    If you did not create this account, please ignore this email.
    
    Best regards,
    Health Camp Team
  `;
  
  return sendEmail({
    email: user.email,
    subject,
    message
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendVerificationEmail
};