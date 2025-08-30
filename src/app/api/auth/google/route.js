import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { connectDB } from "../../../../../lib/mongoose";
import User from "../../../../../models/User";

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXTAUTH_URL}/api/auth/google`
);

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    // Redirect to Google OAuth
    const authorizeUrl = client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"],
    });
    return NextResponse.redirect(authorizeUrl);
  }

  try {
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;

    await connectDB();
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email, password: null });
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    const response = NextResponse.redirect(new URL("/dashboard", req.url));
    response.cookies.set("auth", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(new URL("/login?error=oauth", req.url));
  }
}
