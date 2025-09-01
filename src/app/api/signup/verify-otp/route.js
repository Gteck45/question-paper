import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { connectDB } from "../../../../../lib/mongoose";
import User from "../../../../../models/User";
import OTP from "../../../../../models/OTP";

export async function POST(req) {
  try {
    const { email, otp, password } = await req.json();

    if (!email || !otp || !password) {
      return NextResponse.json(
        { success: false, message: "Email, OTP, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find OTP record
    const otpRecord = await OTP.findOne({ email: email.toLowerCase() });
    
    if (!otpRecord) {
      return NextResponse.json(
        { success: false, message: "OTP expired or not found. Please request a new verification code." },
        { status: 404 }
      );
    }

    // Check if maximum attempts reached
    if (otpRecord.attempts >= 7) {
      await OTP.deleteOne({ email: email.toLowerCase() });
      return NextResponse.json(
        { 
          success: false, 
          message: "Maximum attempts reached. Please request a new verification code." 
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
          message: `Invalid verification code. ${attemptsLeft} attempts remaining.`,
          attemptsLeft 
        },
        { status: 400 }
      );
    }

    // Check if user already exists (double check)
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      await OTP.deleteOne({ email: email.toLowerCase() });
      return NextResponse.json(
        { success: false, message: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword
    });

    // Delete the OTP record
    await OTP.deleteOne({ email: email.toLowerCase() });

    // Generate JWT token
    const token = jwt.sign({ _id: newUser._id }, process.env.JWT_SECRET, { 
      expiresIn: "7d" 
    });

    // Create response and set cookie
    const response = NextResponse.json({
      success: true,
      message: "Account created successfully! Welcome to Question Paper Generator.",
      user: {
        id: newUser._id,
        email: newUser.email
      }
    });

    // Set HTTP-only cookie
    response.cookies.set("auth", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;

  } catch (error) {
    console.error("Verify signup OTP error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
