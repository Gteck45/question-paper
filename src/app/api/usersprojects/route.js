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
        const projectsbyuser = await UserProject.create({
            userId: _id,
            content: [
                {
                    headers: [
                        { courseName: "", styles: [] },
                        { examinationType: "", styles: [] },
                        { semesterYear: "", styles: [] },
                        { subjectName: "", styles: [] },
                        { totalMarks: 0, styles: [] },
                        { time: "", styles: [] },
                        { notes: "", styles: [] },
                        { subjectCode: "", styles: [] },
                        { specialNumber: "", styles: [] },
                    ],

                    questions: [
                        {
                            index: 1,
                            styles: [],
                            text: "",
                            marks: 0,
                            options: [

                            ],
                        },
                    ],
                },
            ],
        });

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
        const { projectId, projectName, content } = await request.json();

        if (!projectId) {
            return NextResponse.json({ message: "Project ID is required" }, { status: 400 });
        }

        // If renaming project
        if (projectName) {
            const user = await User.findOneAndUpdate(
                { _id, "projects.projectId": projectId },
                { $set: { "projects.$.name": projectName } },
                { new: true }
            ).select("projects");

            if (!user) {
                return NextResponse.json({ message: "Project not found" }, { status: 404 });
            }

            return NextResponse.json(user.projects);
        }

        // If updating content
        if (content) {
            const updatedProject = await UserProject.findOneAndUpdate(
                { _id: projectId, userId: _id },
                { $set: { content: content } },
                { new: true }
            );

            if (!updatedProject) {
                return NextResponse.json({ message: "Project not found or user unauthorized" }, { status: 404 });
            }

            return NextResponse.json({ message: "Project saved successfully!", data: updatedProject }, { status: 200 });
        }

        return NextResponse.json({ message: "No valid operation provided" }, { status: 400 });

    } catch (error) {
        console.error("Error updating project:", error);

        if (error.name === 'CastError') {
            return NextResponse.json({ message: `Invalid Project ID format: ${error.value}` }, { status: 400 });
        }

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
