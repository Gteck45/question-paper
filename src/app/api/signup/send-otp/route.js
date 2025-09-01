import { NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/mongoose";
import User from "../../../../../models/User";
import OTP from "../../../../../models/OTP";
import { sendSignupOTPEmail, generateOTP } from "../../../../../lib/nodemailer";

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Delete any existing OTP for this email
    await OTP.deleteOne({ email: email.toLowerCase() });

    // Generate new OTP
    const otp = generateOTP();

    // Save OTP to database
    await OTP.create({
      email: email.toLowerCase(),
      otp: otp,
      attempts: 0
    });

    // Send OTP email
    const emailResult = await sendSignupOTPEmail(email, otp);
    
    if (!emailResult.success) {
      // Clean up OTP if email failed
      await OTP.deleteOne({ email: email.toLowerCase() });
      return NextResponse.json(
        { success: false, message: "Failed to send verification email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email address",
      expiresIn: 300 // 5 minutes
    });

  } catch (error) {
    console.error("Send signup OTP error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
