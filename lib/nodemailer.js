import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  // Check if we have custom SMTP settings
  if (process.env.EMAIL_HOST && process.env.EMAIL_PORT) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
      },
      tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false
      }
    });
  } else {
    // Fallback to service-based configuration (Gmail, Outlook, etc.)
    return nodemailer.createTransport({
      service: 'gmail', // or your email service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD // Use app password for Gmail
      }
    });
  }
};

// Generate 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
export const sendOTPEmail = async (email, otp) => {
  try {
    // Validate environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      throw new Error('Email configuration is missing. Please set EMAIL_USER and EMAIL_APP_PASSWORD in your .env file.');
    }

    const transporter = createTransporter();
    
    // Verify SMTP connection
    try {
      await transporter.verify();
      console.log('SMTP server is ready to take our messages');
    } catch (verifyError) {
      console.error('SMTP verification failed:', verifyError);
      throw new Error('SMTP server connection failed. Please check your email configuration.');
    }
    
    const mailOptions = {
      from: {
        name: 'Question Paper Generator',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'Password Reset OTP - Question Paper Generator',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #4f46e5; margin: 0; font-size: 28px;">🔐 Password Reset</h1>
              <p style="color: #666; margin: 10px 0 0 0;">Question Paper Generator</p>
            </div>
            
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #333; margin: 0 0 15px 0;">Your OTP Code</h2>
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 10px; letter-spacing: 5px; margin: 20px 0;">
                ${otp}
              </div>
            </div>
            
            <div style="background-color: #fef3cd; border: 1px solid #fde047; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
              <p style="margin: 0; color: #92400e; font-weight: 500;">⚠️ Important Security Information:</p>
              <ul style="color: #92400e; margin: 10px 0 0 0; padding-left: 20px;">
                <li>This OTP is valid for <strong>5 minutes only</strong></li>
                <li>You have <strong>7 attempts</strong> to enter the correct OTP</li>
                <li>Never share this code with anyone</li>
                <li>If you didn't request this, please ignore this email</li>
              </ul>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 14px; border-top: 1px solid #eee; padding-top: 20px;">
              <p style="margin: 0;">This email was sent automatically. Please do not reply.</p>
              <p style="margin: 5px 0 0 0;">© 2025 Question Paper Generator. All rights reserved.</p>
            </div>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Send Signup OTP email
export const sendSignupOTPEmail = async (email, otp) => {
  try {
    // Validate environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      throw new Error('Email configuration is missing. Please set EMAIL_USER and EMAIL_APP_PASSWORD in your .env file.');
    }

    const transporter = createTransporter();
    
    // Verify SMTP connection
    try {
      await transporter.verify();
      console.log('SMTP server is ready to take our messages');
    } catch (verifyError) {
      console.error('SMTP verification failed:', verifyError);
      throw new Error('SMTP server connection failed. Please check your email configuration.');
    }
    
    const mailOptions = {
      from: {
        name: 'Question Paper Generator',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'Verify Your Email - Question Paper Generator',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #059669; margin: 0; font-size: 28px;">🎉 Welcome!</h1>
              <p style="color: #666; margin: 10px 0 0 0;">Question Paper Generator</p>
            </div>
            
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #333; margin: 0 0 15px 0;">Email Verification Code</h2>
              <p style="color: #666; margin: 0 0 20px 0;">Please enter this code to complete your registration:</p>
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 10px; letter-spacing: 5px; margin: 20px 0;">
                ${otp}
              </div>
            </div>
            
            <div style="background-color: #dcfce7; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
              <p style="margin: 0; color: #166534; font-weight: 500;">📧 Email Verification Instructions:</p>
              <ul style="color: #166534; margin: 10px 0 0 0; padding-left: 20px;">
                <li>This verification code is valid for <strong>5 minutes only</strong></li>
                <li>You have <strong>7 attempts</strong> to enter the correct code</li>
                <li>Do not share this code with anyone</li>
                <li>Complete your registration by entering this code on the signup page</li>
              </ul>
            </div>
            
            <div style="background-color: #f3f4f6; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
              <p style="margin: 0; color: #374151; font-weight: 500;">✨ What's Next?</p>
              <p style="color: #374151; margin: 10px 0 0 0;">After verification, you'll be able to:</p>
              <ul style="color: #374151; margin: 5px 0 0 0; padding-left: 20px;">
                <li>Create unlimited question papers</li>
                <li>Access AI-powered content generation</li>
                <li>Manage multiple projects</li>
                <li>Export professional PDFs</li>
              </ul>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 14px; border-top: 1px solid #eee; padding-top: 20px;">
              <p style="margin: 0;">This email was sent automatically. Please do not reply.</p>
              <p style="margin: 5px 0 0 0;">© 2025 Question Paper Generator. All rights reserved.</p>
            </div>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Signup verification email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Signup email sending error:', error);
    return { success: false, error: error.message };
  }
};
