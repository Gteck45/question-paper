import { NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/mongoose";
import OTP from "../../../../../models/OTP";

export async function POST(req) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: "Email and OTP are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find OTP record
    const otpRecord = await OTP.findOne({ email: email.toLowerCase() });
    
    if (!otpRecord) {
      return NextResponse.json(
        { success: false, message: "OTP expired or not found. Please request a new one." },
        { status: 404 }
      );
    }

    // Check if maximum attempts reached
    if (otpRecord.attempts >= 7) {
      await OTP.deleteOne({ email: email.toLowerCase() });
      return NextResponse.json(
        { 
          success: false, 
          message: "Maximum attempts reached. Please request a new OTP." 
        },
        { status: 429 }
      );
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      // Increment attempts
      otpRecord.attempts += 1;
      await otpRecord.save();
      
      const attemptsLeft = 7 - otpRecord.attempts;
      return NextResponse.json(
        { 
          success: false, 
          message: `Invalid OTP. ${attemptsLeft} attempts remaining.`,
          attemptsLeft 
        },
        { status: 400 }
      );
    }

    // OTP is valid - don't delete it yet, we'll delete it after password reset
    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
      token: otpRecord._id.toString() // Use this token for password reset
    });

  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
