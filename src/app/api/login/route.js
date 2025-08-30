import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "../../../../lib/mongoose";
import User from "../../../../models/User";
import bcrypt from "bcrypt"
import { rateLimit } from "@daveyplate/next-rate-limit";



export async function POST(req) {
    try {
        // Apply rate limiting
        const rateLimitResponse = await rateLimit({
            request: req,
            response: NextResponse.next(),
            sessionLimit: 8, // 8 requests per session within sessionWindow
            ipLimit: 8, // 8 requests per IP within ipWindow
            sessionWindow: 600, // 10 minutes in seconds
            ipWindow: 600, // 10 minutes in seconds
        });

        // If rate limit was hit, return the rate limit response
        if (rateLimitResponse.status === 429) {
            return NextResponse.json(
                { message: "Too many requests, please try again later." },
                { status: 429 }
            );
        }

        await connectDB()
        const { email, password } = await req.json();
        if (typeof email !== "string" || typeof password !== "string") {
            return NextResponse.json({ message: "Invalid input" }, { status: 400 });
        }
        if (!email || !password) {
            return NextResponse.json({ message: "Email or password both are required" }, { status: 400 })
        }
        const user = await User.findOne({ email: email })
        if (!user) {
            return NextResponse.json({ message: "Invalid email or password" }, { status: 400 })
        }
        const matchPassword = await bcrypt.compare(password, user.password)
        if (!matchPassword) {
            return NextResponse.json({ message: "Invalid email or password" }, { status: 400 })
        }
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" })
        const response = NextResponse.json({ message: "Login successful", token: token }, { status: 200 })
        response.cookies.set("auth", token, {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: "/",
        });
        return response;
    } catch (error) {
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
    }


}