import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const response = NextResponse.json({ message: "Logged out successfully" }, { status: 200 });
    response.cookies.set("auth", "", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0, // Expire immediately
      path: "/",
    });
    return response;
  } catch (error) {
    return NextResponse.json({ message: "Error logging out" }, { status: 500 });
  }
}
