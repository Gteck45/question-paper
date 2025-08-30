import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "../../../../../lib/mongoose";
import UserProject from "../../../../../models/UserProjects";
import { cookies } from "next/headers";

export async function GET(request, { params }) {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth");

  if (!authToken) {
    return NextResponse.json({ message: "No token provided" }, { status: 401 });
  }

  try {
    await connectDB();
    const { _id } = jwt.verify(authToken.value, process.env.JWT_SECRET);
    const { projectId } = await params;

    const project = await UserProject.findOne({ _id: projectId, userId: _id });

    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json({ message: "Error fetching project" }, { status: 500 });
  }
}
