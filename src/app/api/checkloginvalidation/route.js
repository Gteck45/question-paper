import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "../../../../lib/mongoose";
import User from "../../../../models/User";
import { cookies } from "next/headers";

export async function GET(req) {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth");
    
    // Also check for Authorization header
    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    
    const token = authToken?.value || bearerToken;

    if (!token) {
        return NextResponse.json(
            { message: "No token provided" },
            { status: 401 }
        );
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        await connectDB();
        const user = await User.findById(decoded._id);

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: "User is valid", user: { _id: user._id, email: user.email } },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { message: "Invalid token" },
            { status: 401 }
        );
    }
}
