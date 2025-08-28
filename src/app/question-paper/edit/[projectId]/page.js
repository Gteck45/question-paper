"use client";
import { useEffect, useState } from "react";
export default function EditProjectPage({ params }) {
    const [projectId, setProjectId] = useState(null);
    const [projectData, setProjectData] = useState(null);

    useEffect(() => {
        const initializeProjectId = async () => {
            const resolvedParams = await params;
            setProjectId(resolvedParams.projectId);
        };

        initializeProjectId();
    }, [params]);

    useEffect(() => {
        if (!projectId) return;

        const fetchProjectData = async () => {
            const response = await fetch(`/api/projectedit?projectId=${projectId}`);
            const data = await response.json();
            setProjectData(data);

        };

        fetchProjectData();

    }, [projectId]);

    return (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white min-h-screen">
            <h1>Edit Project: {projectId}</h1>
            <div className="flex p-2 text-black">
                <div className="w-1/2 bg-green-200 h-93vh">
                    <div className="mainHeader h-[20%] border">
                        <div className="flex">
                            <input type="text" className="outline rounded w-[80%] p-2" placeholder="Course Name" />
                            <input type="number" className="outline w-[20%]" placeholder="Font Size" /></div>
                        <div className="flex">
                            <input type="text" className="outline rounded w-[80%] p-2" placeholder="Examination type eg Term-End" />
                            <input type="number" className="outline w-[20%]" placeholder="Font Size" /></div>
                        <div className="flex">
                            <input type="text" className="outline rounded w-[80%] p-2" placeholder="Semester or Year" />
                            <input type="number" className="outline w-[20%]" placeholder="Font Size" /></div>
                        <div className="flex">
                            <input type="text" className="outline rounded w-[80%] p-2" placeholder="Subject Name" />
                            <input type="number" className="outline w-[20%]" placeholder="Font Size" /></div>
                    </div>


                </div>
                <div className="w-1/2 bg-blue-200 h-[93vh]" > </div>
            </div>
        </div>
    );
}
