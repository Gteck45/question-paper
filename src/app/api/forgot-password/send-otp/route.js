import { NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/mongoose";
import User from "../../../../../models/User";
import OTP from "../../../../../models/OTP";
import { sendOTPEmail, generateOTP } from "../../../../../lib/nodemailer";

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "No account found with this email address" },
        { status: 404 }
      );
    }

    // Check if user registered with OAuth (no password)
    if (user.password === null) {
      return NextResponse.json(
        { 
          success: false, 
          message: "This account was created with Google OAuth. Please use Google Sign-In instead." 
        },
        { status: 400 }
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
    const emailResult = await sendOTPEmail(email, otp);
    
    if (!emailResult.success) {
      // Clean up OTP if email failed
      await OTP.deleteOne({ email: email.toLowerCase() });
      return NextResponse.json(
        { success: false, message: "Failed to send OTP email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully to your email address",
      expiresIn: 300 // 5 minutes
    });

  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
