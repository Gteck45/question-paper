"use client"
import axios from "axios";
import { useEffect, useState } from "react";
import { useAuth } from "../store/authContext";
import { useNavigation } from "../store/navigationContext";
import AuthGuard from "../component/AuthGuard";
import { useRouter } from "next/navigation";
import { authenticatedFetch, getAuthAxiosConfig } from "../../../lib/authUtils";

export default function Dashboard() {
    const [projects, setProjects] = useState([]);
    const [newProjectName, setNewProjectName] = useState("");
    const [addState, setAddState] = useState(false);
    const [openMenu, setOpenMenu] = useState(null);
    const [renameState, setRenameState] = useState(false);
    const [renameProjectId, setRenameProjectId] = useState(null);
    const [renameProjectName, setRenameProjectName] = useState("");
    const { user, isLoggedIn, requireAuth } = useAuth();
    const { goToLogin, goToProject } = useNavigation();
    const router = useRouter();

    useEffect(() => {
        // Auth is handled by AuthGuard, just fetch projects
        const fetchProjects = async () => {
            try {
                const response = await authenticatedFetch("/api/usersprojects");
                const data = await response.json();
                // Ensure data is an array
                setProjects(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching projects:", error);
                setProjects([]); // Set empty array on error
            }
        };

        fetchProjects();
    }, []);

    // Close menu on outside click
    useEffect(() => {
        const handler = (e) => {
            if (!e.target.closest('.dropdown-container')) {
                setOpenMenu(null);
            }
        };
        document.addEventListener("click", handler);
        return () => document.removeEventListener("click", handler);
    }, []);

    const handleDelete = async (projectId, projectName) => {
        if (confirm(`Are you sure you want to delete "${projectName}"?`)) {
            try {
                const response = await axios.delete(`/api/usersprojects`, getAuthAxiosConfig({
                    data: {
                        projectId: projectId
                    }
                }));
                setProjects(response.data);
                setOpenMenu(null);
            } catch (error) {
                console.error("Error deleting project:", error);
                alert("Failed to delete project");
            }
        }
    };

    const handleRename = async () => {
        try {
            const response = await axios.put(`/api/usersprojects`, {
                projectId: renameProjectId,
                projectName: renameProjectName
            }, getAuthAxiosConfig());
            setProjects(response.data);
            setRenameState(false);
            setRenameProjectId(null);
            setRenameProjectName("");
            setOpenMenu(null);
        } catch (error) {
            console.error("Error renaming project:", error);
            alert("Failed to rename project");
        }
    };

    const handleLogout = async () => {
        try {
            await axios.post("/api/logout");
            setLogstate(false);
            setUser(null);
            router.push("/login");
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    const openRenameModal = (project) => {
        setRenameProjectId(project.projectId);
        setRenameProjectName(project.name);
        setRenameState(true);
        setOpenMenu(null);
    };

    return (
        <AuthGuard requireAuth={true}>
            <>
            {/* Backdrop */}
            {(addState || renameState) && (
                <div className="fixed inset-0  bg-opacity-50 z-40" />
            )}

            {/* Add Project Modal */}
            {addState && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-96 max-w-90vw transform transition-all">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">Create New Project</h2>
                            <button
                                onClick={() => setAddState(false)}
                                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                            >
                                ×
                            </button>
                        </div>
                        <input
                            type="text"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="Enter project name"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none mb-4 text-black"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setAddState(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        const response = await axios.post("/api/usersprojects", {
                                            projectName: newProjectName,
                                        }, getAuthAxiosConfig());
                                        setProjects(response.data);
                                        setNewProjectName("");
                                        setAddState(false);
                                    } catch (error) {
                                        console.error("Error adding project:", error);
                                    }
                                }}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Create Project
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rename Project Modal */}
            {renameState && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-96 max-w-90vw transform transition-all">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">Rename Project</h2>
                            <button
                                onClick={() => {
                                    setRenameState(false);
                                    setRenameProjectId(null);
                                    setRenameProjectName("");
                                }}
                                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                            >
                                ×
                            </button>
                        </div>
                        <input
                            type="text"
                            value={renameProjectName}
                            onChange={(e) => setRenameProjectName(e.target.value)}
                            placeholder="Enter new project name"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none mb-4 text-black"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setRenameState(false);
                                    setRenameProjectId(null);
                                    setRenameProjectName("");
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRename}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Dashboard Layout */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white min-h-screen overflow-x-hidden">
                <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
                        <div className="flex-1">
                            <h1 className="text-2xl sm:text-3xl font-bold mb-2">My Projects</h1>
                            <p className="text-gray-400 text-sm sm:text-base">Manage your question paper projects</p>
                            {user && <p className="text-gray-300 text-xs sm:text-sm mt-1">Welcome, {user.email}</p>}
                        </div>
                        <div className="flex gap-3 sm:gap-4 w-full sm:w-auto">
                            <button
                                onClick={() => setAddState(true)}
                                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 flex-1 sm:flex-none text-sm sm:text-base"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M5 12h14" />
                                    <path d="M12 5v14" />
                                </svg>
                                New Project
                            </button>
                        </div>
                    </div>

                    {/* Projects Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pb-8">
                        {projects.map((project) => (
                            <div
                                key={project.projectId}
                                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 sm:p-6 hover:bg-white/15 transition-all duration-200 group will-change-transform"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base sm:text-lg font-semibold text-white truncate mb-1">
                                            {project.name}
                                        </h3>
                                        <p className="text-gray-400 text-xs sm:text-sm">
                                            Created {new Date().toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div className="relative dropdown-container">
                                        <button
                                            onClick={() => setOpenMenu(openMenu === project.projectId ? null : project.projectId)}
                                            className="p-2 hover:bg-white/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                                        >
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                                <circle cx="12" cy="5" r="2"/>
                                                <circle cx="12" cy="12" r="2"/>
                                                <circle cx="12" cy="19" r="2"/>
                                            </svg>
                                        </button>

                                        {openMenu === project.projectId && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-20 overflow-hidden">
                                                <button
                                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-gray-700 transition-colors"
                                                    onClick={() => openRenameModal(project)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                                                        <path d="m15 5 4 4" />
                                                    </svg>
                                                    Rename Project
                                                </button>
                                                <button
                                                    className="w-full text-left px-4 py-3 hover:bg-red-50 flex items-center gap-3 text-red-600 transition-colors"
                                                    onClick={() => handleDelete(project.projectId, project.name)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                                        <path d="M3 6h18" />
                                                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                    </svg>
                                                    Delete Project
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">
                                        Active
                                    </span>
                                    <button 
                                        className="text-gray-400 hover:text-white text-sm transition-colors cursor-pointer" 
                                        onClick={() => goToProject(project.projectId)}
                                    >
                                        Open →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {projects.length === 0 && (
                        <div className="text-center py-16">
                            <div className="text-gray-400 mb-4">
                                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                <h3 className="text-lg font-medium text-gray-300 mb-2">No projects yet</h3>
                                <p className="text-gray-500">Create your first project to get started</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
        </AuthGuard>
    );
}
