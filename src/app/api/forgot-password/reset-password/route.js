import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { connectDB } from "../../../../../lib/mongoose";
import User from "../../../../../models/User";
import OTP from "../../../../../models/OTP";

export async function POST(req) {
  try {
    const { email, newPassword, token } = await req.json();

    if (!email || !newPassword || !token) {
      return NextResponse.json(
        { success: false, message: "Email, password, and verification token are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify the OTP token is still valid
    const otpRecord = await OTP.findById(token);
    if (!otpRecord || otpRecord.email !== email.toLowerCase()) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    await User.findByIdAndUpdate(user._id, { password: hashedPassword });

    // Delete the OTP record
    await OTP.deleteOne({ _id: token });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. You can now login with your new password."
    });

  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
