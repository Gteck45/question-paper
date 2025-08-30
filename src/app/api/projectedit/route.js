import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "../../../../lib/mongoose";
import User from "../../../../models/User";
import { cookies } from "next/headers";
import UserProject from "../../../../models/UserProjects";

export async function GET(request) {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth");

    if (!authToken) {
        return NextResponse.json({ message: "No token provided" }, { status: 401 });
    }

    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');

        if (!projectId || typeof projectId !== "string") {
            return NextResponse.json({ message: "Project ID is required" }, { status: 400 });
        }
        const { _id } = jwt.verify(authToken.value, process.env.JWT_SECRET);

        const user = await User.findById(_id);
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }
        const userproject = await UserProject.findOne({ _id: projectId });
        if (!userproject) {
            return NextResponse.json({ message: "Project not found" }, { status: 404 });
        }

        return NextResponse.json(userproject);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching projects" }, { status: 500 });
    }
}


export async function PUT(request) {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth");

    if (!authToken) {
        return NextResponse.json({ message: "No token provided" }, { status: 401 });
    }

    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');

        if (!projectId || typeof projectId !== "string") {
            return NextResponse.json({ message: "Project ID is required" }, { status: 400 });
        }
        const { _id } = jwt.verify(authToken.value, process.env.JWT_SECRET);
        const { content } = await request.json();

        if (!content) {
            return NextResponse.json({ message: "Content is required" }, { status: 400 });
        }

        const updatedProject = await UserProject.findByIdAndUpdate(projectId, { content }, { new: true });
        if (!updatedProject) {
            return NextResponse.json({ message: "Project not found" }, { status: 404 });
        }

        return NextResponse.json(updatedProject);
    } catch (error) {
        return NextResponse.json({ message: "Error updating project" }, { status: 500 });
    }
}
