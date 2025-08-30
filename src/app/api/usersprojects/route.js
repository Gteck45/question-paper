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
        // This is the ID of the logged-in user from the token
        const { _id: loggedInUserId } = jwt.verify(authToken.value, process.env.JWT_SECRET);

        // This is the ID of the document we want to edit from the URL
        const projectId = request.nextUrl.searchParams.get("projectId");

        const { content } = await request.json();

        if (!projectId) {
            return NextResponse.json({ message: "Project ID is required" }, { status: 400 });
        }
        if (!content) {
            return NextResponse.json({ message: "Content is required" }, { status: 400 });
        }

        // 2. Use the new UserProject model to find and update
        const updatedProject = await UserProject.findOneAndUpdate(
            // 3. Find the project by its ID AND make sure it belongs to the logged-in user
            { _id: projectId, userId: loggedInUserId },
            // 4. Set the top-level 'content' field with the new data
            { $set: { content: content } },
            { new: true } // Return the updated document
        );

        if (!updatedProject) {
            // This error means either the project doesn't exist OR the user doesn't have permission to edit it
            return NextResponse.json({ message: "Project not found or user unauthorized" }, { status: 404 });
        }

        return NextResponse.json({ message: "Project saved successfully!", data: updatedProject }, { status: 200 });

    } catch (error) {
        console.error("Error updating project:", error);

        // Check for specific Mongoose CastError (invalid ObjectId format)
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
