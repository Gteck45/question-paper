import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "../../../../lib/mongoose";
import User from "../../../../models/User";
import bcrypt from "bcrypt"


export async function POST(request) {
    try {
        await connectDB();
        const { email, password } = await request.json();
        if (typeof email !== "string" || typeof password !== "string") {
            return NextResponse.json({ message: "Invalid input" }, { status: 400 });
        }
        const user = await User.findOne({ email });
        if (user) {
            return NextResponse.json({ message: "User already exist" }, { status: 400 })
        }
        const hashPassword = await bcrypt.hash(password, 10)
        const newUser = await User.create({ email, password: hashPassword })
        const token = jwt.sign({ _id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" })
        const response = NextResponse.json({ message: "User created successfully" }, { status: 201 })
        response.cookies.set("auth", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60,
            path: "/",
        });
        return response

    } catch (error) {
        return NextResponse.json({ message: "Error occured" }, { status: 500 })
    }
}