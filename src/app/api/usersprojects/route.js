import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "../../../../lib/mongoose";
import User from "../../../../models/User";
import { cookies } from "next/headers";
import UserProject from "../../../../models/UserProjects";

export async function GET() {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth");

    if (!authToken) {
        return NextResponse.json({ message: "No token provided" }, { status: 401 });
    }

    try {
        await connectDB();
        const { _id } = jwt.verify(authToken.value, process.env.JWT_SECRET);

        const user = await User.findById(_id).select("projects");
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user.projects);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching projects" }, { status: 500 });
    }
}


export async function POST(request) {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth");

    if (!authToken) {
        return NextResponse.json({ message: "No token provided" }, { status: 401 });
    }

    try {
        await connectDB();
        const { _id } = jwt.verify(authToken.value, process.env.JWT_SECRET);
        const { projectName } = await request.json();

        if (!projectName) {
            return NextResponse.json({ message: "Project name is required" }, { status: 400 });
        }
        const projectsbyuser = await UserProject.create({ userId: _id, content: [] });
        const newProject = { name: projectName, projectId: projectsbyuser._id };

        const user = await User.findByIdAndUpdate(
            _id,
            { $push: { projects: newProject } },
            { new: true }
        ).select("projects");

        return NextResponse.json(user.projects, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: "Error creating project" }, { status: 500 });
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
        const { _id } = jwt.verify(authToken.value, process.env.JWT_SECRET);
        const { projectId, projectName } = await request.json();

        if (!projectId || !projectName) {
            return NextResponse.json({ message: "Project ID and name are required" }, { status: 400 });
        }

        const user = await User.findOneAndUpdate(
            { _id, "projects.projectId": projectId },
            { $set: { "projects.$.name": projectName } },
            { new: true }
        ).select("projects");

        if (!user) {
            return NextResponse.json({ message: "Project not found" }, { status: 404 });
        }

        return NextResponse.json(user.projects);
    } catch (error) {
        return NextResponse.json({ message: "Error updating project" }, { status: 500 });
    }
}


export async function DELETE(request) {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth");

    if (!authToken) {
        return NextResponse.json({ message: "No token provided" }, { status: 401 });
    }

    try {
        await connectDB();
        const { _id } = jwt.verify(authToken.value, process.env.JWT_SECRET);
        const { projectId } = await request.json();

        if (!projectId) {
            return NextResponse.json({ message: "Project ID is required" }, { status: 400 });
        }
        await UserProject.findOneAndDelete({ _id: projectId });

        const user = await User.findByIdAndUpdate(
            _id,
            { $pull: { projects: { projectId } } },
            { new: true }
        ).select("projects");

        if (!user) {
            return NextResponse.json({ message: "Project not found" }, { status: 404 });
        }

        return NextResponse.json(user.projects);
    } catch (error) {
        return NextResponse.json({ message: "Error deleting project" }, { status: 500 });
    }
}
