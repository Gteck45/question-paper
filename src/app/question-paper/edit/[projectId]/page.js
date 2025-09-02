"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from 'react-hot-toast';
import PreviewPanel from "../../../component/PreviewPanel"; // Ensure this path is correct
import AIChatSidebar from "../../../component/AIChatSidebar"; // Import the new AI Chat component
import AuthGuard from "../../../component/AuthGuard";
import '../ai-chat.css'; // Import custom styles for AI chat
import { useAuth } from "../../../store/authContext";
import { useNavigation } from "../../../store/navigationContext";

// --- SVG Icons for Buttons ---
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>;
const ExportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;
const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;

const StyleControls = ({ currentStyles = [], onStyleChange }) => (
    <div className="flex items-center gap-1 p-1.5 bg-zinc-800 rounded-md border border-zinc-700">
        <button
            onClick={() => onStyleChange('bold', currentStyles.includes('font-bold') ? 'font-normal' : 'font-bold')}
            className={`px-2 py-1 text-xs rounded font-mono font-bold transition-colors ${currentStyles.includes('font-bold') ? 'bg-blue-500 text-white' : 'bg-zinc-600 hover:bg-zinc-500 text-zinc-200'}`}
        >
            B
        </button>
        <button
            onClick={() => onStyleChange('underline', currentStyles.includes('underline') ? '' : 'underline')}
            className={`px-2 py-1 text-xs rounded font-mono underline transition-colors ${currentStyles.includes('underline') ? 'bg-blue-500 text-white' : 'bg-zinc-600 hover:bg-zinc-500 text-zinc-200'}`}
        >
            U
        </button>
        <select
            onChange={(e) => onStyleChange('fontSize', e.target.value)}
            value={currentStyles.find(s => s.startsWith('text-')) || 'text-base'}
            className="px-1 py-1 text-xs rounded border-none bg-zinc-600 text-white focus:ring-2 focus:ring-blue-500"
        >
            <option value="text-xs">XS</option>
            <option value="text-sm">SM</option>
            <option value="text-base">MD</option>
            <option value="text-lg">LG</option>
            <option value="text-xl">XL</option>
            <option value="text-2xl">2XL</option>
            <option value="text-3xl">3XL</option>
            <option value="text-4xl">4XL</option>
        </select>
    </div>
);

// Enhanced component for the hidden multi-page preview used for "Export All"
const MultiPagePreview = React.forwardRef(({ content }, ref) => (
    <div ref={ref} className="bg-white">
        {content.map((doc, index) => (
            <div
                key={index}
                className={index > 0 ? 'page-break' : ''}
                style={{
                    pageBreakBefore: index > 0 ? 'always' : 'auto',
                    pageBreakInside: 'avoid'
                }}
            >
                <PreviewPanel projectData={doc} />
            </div>
        ))}
    </div>
));
MultiPagePreview.displayName = 'MultiPagePreview';

const createDefaultDocument = () => ({
    headers: [
        { courseName: "", styles: ["text-lg", "font-bold"] },
        { examinationType: "", styles: ["text-base", "font-bold"] },
        { InstuteName: "", styles: ["text-base", "font-bold"] },
        { semesterYear: "", styles: ["text-base", "font-bold"] },
        { subjectName: "", styles: ["text-base", "font-normal"] },
        { totalMarks: "", styles: ["text-sm", "font-bold"] },
        { time: "", styles: ["text-sm", "font-bold"] },
        { notes: "", styles: ["text-sm", "italic"] },
        { subjectCode: "", styles: ["font-sans", "font-bold"] },
        { specialNumber: "", styles: ["font-sans", "font-bold"] }
    ],
    questions: []
});

export default function EditProjectPage() {
    const params = useParams();
    const projectId = params.projectId;
    const router = useRouter();
    const { requireAuth } = useAuth();
    const { 
        configureNavigation, 
        markAsUnsaved, 
        markAsSaved,
        hasUnsavedChanges 
    } = useNavigation();

    const [fullProjectData, setFullProjectData] = useState(null);
    const [activeContentIndex, setActiveContentIndex] = useState(0);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const [isLoading, setIsLoading] = useState(true);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const previewRef = useRef(null);
    const multiPagePreviewRef = useRef(null);
    const [isExporting, setIsExporting] = useState(false);
    const [pageSize, setPageSize] = useState('A4');
    const [isPreparingExport, setIsPreparingExport] = useState(false);
    const [pdfOrientation, setPdfOrientation] = useState('portrait');
    const [pdfQuality, setPdfQuality] = useState('high');

    const headerPlaceholders = {
        courseName: "Course Name (e.g., B.Tech)",
        examinationType: "Examination Type (e.g., Term-End Examination)",
        semesterYear: "Semester / Year (e.g., August, 2025)",
        subjectName: "Subject Name (e.g., Intro to Programming)",
        totalMarks: "Maximum Marks",
        time: "Time Allowed (e.g., 3 hours)",
        notes: "Notes for Students",
        subjectCode: "Subject Code (e.g., CS-501)",
        specialNumber: "Special Number / ID",
        InstuteName: "Institute Name (e.g., ABC Institute)",
    };

    useEffect(() => {
        // Auth is handled by AuthGuard, proceed with data fetching
        if (!projectId) return;

        const fetchProjectData = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/projectedit/${projectId}`);
                if (!response.ok) throw new Error('Failed to fetch project data.');

                const data = await response.json();
                if (data && data.content && data.content.length > 0) {
                   
                    setFullProjectData(data);
                    
                } else {
                    setFullProjectData({ content: [createDefaultDocument()] });
                }
                setActiveContentIndex(0);
            } catch (error) {
                console.error("Fetch error:", error);
                toast.error(error.message || "Could not load project.");
            } finally {
                setIsLoading(false);
                setIsAuthLoading(false);
            }
        };
        fetchProjectData();

    }, [projectId]);

    // Navigation warning setup
    useEffect(() => {
        // Configure navigation for this page
        const saveProject = async () => {
            if (!fullProjectData) return;
            
            const response = await fetch(`/api/usersprojects`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, content: fullProjectData.content })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save project.');
            }
        };

        configureNavigation({
            enableWarnings: true,
            onSave: saveProject
        });

        // Set up beforeunload event listener for browser navigation (refresh, close, etc.)
        const handleBeforeUnload = (e) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return 'You have unsaved changes. Are you sure you want to leave?';
            }
        };

        // Add event listener
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Cleanup
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            configureNavigation({ enableWarnings: false, onSave: null });
        };
    }, [hasUnsavedChanges, configureNavigation, fullProjectData, projectId]);

    // Track changes to set unsaved changes flag
    useEffect(() => {
        // Mark as having unsaved changes whenever fullProjectData changes
        // (except on initial load)
        if (fullProjectData && !isLoading) {
            markAsUnsaved();
        }
    }, [fullProjectData, isLoading, markAsUnsaved]);

    // Keyboard shortcuts for quick actions
    useEffect(() => {
        const handleKeyDown = (event) => {
            // Ctrl+E or Cmd+E for quick export
            if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
                event.preventDefault();
                handleExportPDF('current');
            }
            // Ctrl+S or Cmd+S for save (override default)
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault();
                saveProject();
            }
        };

        const handleClickOutside = (event) => {
            const dropdown = document.getElementById('export-dropdown');
            const button = event.target.closest('button');
            if (dropdown && !dropdown.contains(event.target) && (!button || !button.textContent.includes('Export PDF'))) {
                dropdown.classList.add('hidden');
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('click', handleClickOutside);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (isPreparingExport && multiPagePreviewRef.current) {
            const generateAndDownload = async () => {
                const loadingToast = toast.loading('Generating PDF for all documents...');

                const generateCompleteHTML = (html) => {
                    let allCSS = "";
                    for (const sheet of document.styleSheets) {
                        try {
                            for (const rule of sheet.cssRules) allCSS += rule.cssText;
                        } catch (e) { console.warn("Could not read CSS rules:", e); }
                    }

                    // Enhanced CSS cleanup and PDF-specific styles
                    const cleanedCSS = allCSS
                        .replace(/lab\([^)]+\)/g, '#000')
                        .replace(/oklab\([^)]+\)/g, '#000')
                        .replace(/color-mix\([^)]+\)/g, '#000');

                    // Add PDF-specific styles for better rendering
                    const pdfSpecificCSS = `
                        @media print {
                            * {
                                -webkit-print-color-adjust: exact !important;
                                color-adjust: exact !important;
                                print-color-adjust: exact !important;
                            }
                            
                            .page-break {
                                page-break-before: always;
                            }
                            
                            .avoid-break {
                                page-break-inside: avoid;
                            }
                            
                            .break-after {
                                page-break-after: always;
                            }
                            
                            body {
                                line-height: 1.4;
                            }
                            
                            h1, h2, h3, h4, h5, h6 {
                                page-break-after: avoid;
                            }
                        }
                        
                        /* Explicit Tailwind font size definitions for PDF */
                        .text-xs { font-size: 0.75rem !important; line-height: 1rem !important; }
                        .text-sm { font-size: 0.875rem !important; line-height: 1.25rem !important; }
                        .text-base { font-size: 1rem !important; line-height: 1.5rem !important; }
                        .text-lg { font-size: 1.125rem !important; line-height: 1.75rem !important; }
                        .text-xl { font-size: 1.25rem !important; line-height: 1.75rem !important; }
                        .text-2xl { font-size: 1.5rem !important; line-height: 2rem !important; }
                        .text-3xl { font-size: 1.875rem !important; line-height: 2.25rem !important; }
                        .text-4xl { font-size: 2.25rem !important; line-height: 2.5rem !important; }
                        
                        /* Font weights */
                        .font-normal { font-weight: 400 !important; }
                        .font-bold { font-weight: 700 !important; }
                        
                        /* Text decorations */
                        .underline { text-decoration: underline !important; }
                        .italic { font-style: italic !important; }
                        
                        /* Font families */
                        .font-serif { font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif !important; }
                        .font-sans { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif !important; }
                        
                        @page {
                            margin: 10mm;
                            size: ${pageSize} ${pdfOrientation};
                        }
                    `;

                    return `<!DOCTYPE html>
                    <html>
                        <head>
                            <meta charset="UTF-8">
                            <title>Question Paper Export</title>
                            <style>${cleanedCSS}${pdfSpecificCSS}</style>
                        </head>
                        <body>${html}</body>
                    </html>`;
                };

                const htmlContent = generateCompleteHTML(multiPagePreviewRef.current.innerHTML);

                try {
                    const response = await fetch('/api/generate-pdf', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            htmlContent,
                            format: pageSize,
                            orientation: pdfOrientation,
                            quality: pdfQuality
                        }),
                    });
                    if (!response.ok) throw new Error('PDF generation failed on the server.');

                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${projectId}-all-${pageSize}-${pdfOrientation}-export.pdf`;
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                    toast.success(`All documents exported successfully! (${pageSize}, ${pdfOrientation}, ${pdfQuality} quality)`, { id: loadingToast });
                } catch (error) {
                    console.error('Export All Error:', error);
                    toast.error(error.message || 'Failed to export all documents.', { id: loadingToast });
                } finally {
                    setIsExporting(false);
                    setIsPreparingExport(false);
                }
            };
            setTimeout(generateAndDownload, 100);
        }
    }, [isPreparingExport, pageSize, projectId]);

    const applyAIChanges = (newQuestionPaper) => {
        if (newQuestionPaper && newQuestionPaper.content) {
            setFullProjectData(newQuestionPaper);
        }
    };

    const saveProject = async () => {
        if (!fullProjectData) return;
        setIsSaving(true);
        const loadingToast = toast.loading('Saving project...');
        try {
            const response = await fetch(`/api/usersprojects`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, content: fullProjectData.content })
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save project.');
            }
            toast.success('Project saved successfully!', { id: loadingToast });
            markAsSaved(); // Clear unsaved changes flag after successful save
        } catch (error) {
            console.error("Save error:", error);
            toast.error(error.message, { id: loadingToast });
        } finally {
            setIsSaving(false);
        }
    };

    const handleExportPDF = async (scope = 'current') => {
        setIsExporting(true);

        if (scope === 'all') {
            setIsPreparingExport(true);
            return;
        }

        const loadingToast = toast.loading('Generating PDF...');
        const generateCompleteHTML = () => {
            if (!previewRef.current) return null;
            const contentHTML = previewRef.current.innerHTML;
            let allCSS = "";
            for (const sheet of document.styleSheets) {
                try {
                    for (const rule of sheet.cssRules) allCSS += rule.cssText;
                } catch (e) { console.warn("Could not read CSS rules:", e); }
            }

            // Enhanced CSS cleanup and PDF-specific styles for single document
            const cleanedCSS = allCSS
                .replace(/lab\([^)]+\)/g, '#000')
                .replace(/oklab\([^)]+\)/g, '#000')
                .replace(/color-mix\([^)]+\)/g, '#000');

            // Add PDF-specific styles for better rendering
            const pdfSpecificCSS = `
                @media print {
                    * {
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    
                    body {
                        line-height: 1.4;
                    }
                    
                    h1, h2, h3, h4, h5, h6 {
                        page-break-after: avoid;
                    }
                }
                
                /* Explicit Tailwind font size definitions for PDF */
                .text-xs { font-size: 0.75rem !important; line-height: 1rem !important; }
                .text-sm { font-size: 0.875rem !important; line-height: 1.25rem !important; }
                .text-base { font-size: 1rem !important; line-height: 1.5rem !important; }
                .text-lg { font-size: 1.125rem !important; line-height: 1.75rem !important; }
                .text-xl { font-size: 1.25rem !important; line-height: 1.75rem !important; }
                .text-2xl { font-size: 1.5rem !important; line-height: 2rem !important; }
                .text-3xl { font-size: 1.875rem !important; line-height: 2.25rem !important; }
                .text-4xl { font-size: 2.25rem !important; line-height: 2.5rem !important; }
                
                /* Font weights */
                .font-normal { font-weight: 400 !important; }
                .font-bold { font-weight: 700 !important; }
                
                /* Text decorations */
                .underline { text-decoration: underline !important; }
                .italic { font-style: italic !important; }
                
                /* Font families */
                .font-serif { font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif !important; }
                .font-sans { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif !important; }
                
                @page {
                    margin: 10mm;
                    size: ${pageSize} ${pdfOrientation};
                }
            `;

            return `<!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Question Paper - ${projectId}</title>
                    <style>${cleanedCSS}${pdfSpecificCSS}</style>
                </head>
                <body>${contentHTML}</body>
            </html>`;
        };

        const htmlContent = generateCompleteHTML();
        if (!htmlContent) {
            toast.error('Could not generate HTML.', { id: loadingToast });
            setIsExporting(false);
            return;
        }

        try {
            const response = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    htmlContent,
                    format: pageSize,
                    orientation: pdfOrientation,
                    quality: pdfQuality
                }),
            });
            if (!response.ok) throw new Error('PDF generation failed on the server.');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${projectId}-current-${pageSize}-${pdfOrientation}-export.pdf`;
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success(`Current document exported successfully! (${pageSize}, ${pdfOrientation}, ${pdfQuality} quality)`, { id: loadingToast });
        } catch (error) {
            console.error('Export Current Error:', error);
            toast.error(error.message || 'Failed to export current document.', { id: loadingToast });
        } finally {
            setIsExporting(false);
        }
    };

    const updateActiveContentData = (updater) => {
        setFullProjectData(prevData => {
            const newData = JSON.parse(JSON.stringify(prevData));
            updater(newData.content[activeContentIndex]);
            return newData;
        });
    };

    const addDocument = (type = 'blank') => {
        setFullProjectData(prevData => {
            const newContent = JSON.parse(JSON.stringify(prevData.content));
            if (type === 'copy' && newContent.length > 0) {
                newContent.push(JSON.parse(JSON.stringify(newContent[0])));
            } else {
                newContent.push(createDefaultDocument());
            }
            return { ...prevData, content: newContent };
        });
        setActiveContentIndex(fullProjectData.content.length);
        toast.success(`Added new ${type} document!`);
    };

    const deleteDocument = (indexToDelete) => {
        if (fullProjectData.content.length <= 1) {
            toast.error("Cannot delete the last document.");
            return;
        }
        setFullProjectData(prevData => {
            const newContent = prevData.content.filter((_, i) => i !== indexToDelete);
            return { ...prevData, content: newContent };
        });
        if (activeContentIndex >= indexToDelete) {
            setActiveContentIndex(Math.max(0, activeContentIndex - 1));
        }
        toast.success(`Document ${indexToDelete + 1} deleted.`);
    };

    // Remove the old navigation warning handlers since they're now handled by the context

    const addMainQuestion = () => updateActiveContentData(data => {
        data.questions.push({ index: data.questions.length + 1, styles: ["text-sm"], text: "", marks: 0, options: [] });
    });
    const addSubQuestion = (qIndex) => updateActiveContentData(data => {
        const question = data.questions[qIndex];
        const subIndex = String.fromCharCode(97 + question.options.length);
        question.options.push({ index: subIndex, styles: ["text-sm"], text: "", marks: 0, options: [] });
    });
    const addSubSubQuestion = (qIndex, subQIndex) => updateActiveContentData(data => {
        const subQuestion = data.questions[qIndex].options[subQIndex];
        if (!subQuestion.options) subQuestion.options = [];
        const roman = ['i', 'ii', 'iii', 'iv', 'v'];
        const index = roman[subQuestion.options.length] || `${subQuestion.options.length + 1}`;
        subQuestion.options.push({ index, styles: ["text-sm"], text: "", marks: 0 });
    });
    const deleteQuestion = (indices) => updateActiveContentData(data => {
        if (indices.length === 1) {
            data.questions.splice(indices[0], 1);
            data.questions.forEach((q, i) => q.index = i + 1);
        } else if (indices.length === 2) {
            const mainQ = data.questions[indices[0]];
            mainQ.options.splice(indices[1], 1);
            mainQ.options.forEach((sq, i) => sq.index = String.fromCharCode(97 + i));
        } else if (indices.length === 3) {
            data.questions[indices[0]].options[indices[1]].options.splice(indices[2], 1);
        }
    });

    if (isAuthLoading || isLoading || !fullProjectData) {
        return <div className="flex items-center justify-center min-h-screen bg-zinc-900 text-white text-xl">Loading Editor...</div>;
    }

    const activeContent = fullProjectData.content[activeContentIndex];

    return (
        <AuthGuard requireAuth={true}>
            <div className="bg-zinc-900 text-zinc-200 h-screen overflow-hidden font-sans">
            <header className="p-3 sm:p-4 sticky top-0 bg-zinc-900/90 backdrop-blur-sm z-20 border-b border-zinc-800">
                {/* RESPONSIVE: Changed flex-wrap to flex-col md:flex-row for stacking on mobile */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 max-w-7xl mx-auto">
                    <h1 className="text-lg sm:text-xl font-bold text-center md:text-left">Editing: <span className="text-blue-400 block sm:inline">{projectId}</span></h1>
                    {/* RESPONSIVE: Added flex-wrap for smaller screen button groups */}
                    <div className="flex flex-wrap items-center justify-center gap-2 w-full md:w-auto">
                        {/* Enhanced PDF Configuration Panel - Made More Responsive */}
                        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-2 bg-zinc-800 p-2 rounded-lg border border-zinc-700 w-full lg:w-auto">
                            {/* Top row for mobile, inline for desktop */}
                            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                                {/* Page Size Selector */}
                                <div className="flex flex-col min-w-[85px] flex-1 lg:flex-none">
                                    <label className="text-xs text-zinc-400 mb-1">Size</label>
                                    <select
                                        value={pageSize}
                                        onChange={(e) => setPageSize(e.target.value)}
                                        className="bg-zinc-700 border-zinc-600 rounded-md px-2 py-1.5 text-xs text-white w-full"
                                        aria-label="Page Size"
                                    >
                                        <option value="A4">A4</option>
                                        <option value="A3">A3</option>
                                        <option value="A5">A5</option>
                                        <option value="Letter">Letter</option>
                                        <option value="Legal">Legal</option>
                                        <option value="Tabloid">Tabloid</option>
                                        <option value="B4">B4</option>
                                        <option value="B5">B5</option>
                                        <option value="Executive">Executive</option>
                                        <option value="Folio">Folio</option>
                                    </select>
                                </div>

                                {/* Orientation Selector */}
                                <div className="flex flex-col min-w-[70px] flex-1 lg:flex-none">
                                    <label className="text-xs text-zinc-400 mb-1">Orient</label>
                                    <select
                                        value={pdfOrientation}
                                        onChange={(e) => setPdfOrientation(e.target.value)}
                                        className="bg-zinc-700 border-zinc-600 rounded-md px-2 py-1.5 text-xs text-white w-full"
                                        aria-label="PDF Orientation"
                                    >
                                        <option value="portrait">Portrait</option>
                                        <option value="landscape">Landscape</option>
                                    </select>
                                </div>

                                {/* Quality Selector */}
                                <div className="flex flex-col min-w-[60px] flex-1 lg:flex-none">
                                    <label className="text-xs text-zinc-400 mb-1">Quality</label>
                                    <select
                                        value={pdfQuality}
                                        onChange={(e) => setPdfQuality(e.target.value)}
                                        className="bg-zinc-700 border-zinc-600 rounded-md px-2 py-1.5 text-xs text-white w-full"
                                        aria-label="PDF Quality"
                                    >
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
                                </div>
                            </div>

                            {/* Export Dropdown */}
                            <div className="relative w-full lg:w-auto mt-2 lg:mt-0 lg:ml-2">
                                <button
                                    disabled={isExporting}
                                    onClick={() => {
                                        // Toggle dropdown visibility on click instead of hover
                                        const dropdown = document.getElementById('export-dropdown');
                                        dropdown.classList.toggle('hidden');
                                    }}
                                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-md font-semibold text-xs shadow-lg flex items-center gap-2 disabled:bg-zinc-600 disabled:cursor-not-allowed w-full lg:w-auto justify-center min-w-[100px]"
                                >
                                    <ExportIcon /> {isExporting ? 'Exporting...' : 'Export PDF'}
                                </button>
                                <div
                                    id="export-dropdown"
                                    className="hidden absolute top-full right-0 w-full lg:w-48 bg-zinc-700 border border-zinc-600 rounded-md shadow-lg z-20 mt-1"
                                >
                                    <div className="p-2">
                                        <a
                                            onClick={() => {
                                                handleExportPDF('current');
                                                document.getElementById('export-dropdown').classList.add('hidden');
                                            }}
                                            className="block px-3 py-2 text-xs text-white hover:bg-zinc-600 cursor-pointer rounded mb-1"
                                        >
                                            📄 Export Current Document
                                        </a>
                                        <a
                                            onClick={() => {
                                                handleExportPDF('all');
                                                document.getElementById('export-dropdown').classList.add('hidden');
                                            }}
                                            className="block px-3 py-2 text-xs text-white hover:bg-zinc-600 cursor-pointer rounded"
                                        >
                                            📚 Export All Documents
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsChatOpen(true)}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-4 py-2 rounded-lg font-semibold shadow-lg flex items-center gap-2 transition-all"
                        >
                            <ChatIcon /> AI Assistant
                        </button>
                        <button onClick={saveProject} disabled={isSaving} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-semibold shadow-lg disabled:bg-zinc-600 disabled:cursor-not-allowed">
                            {isSaving ? 'Saving...' : 'Save Project'}
                        </button>
                    </div>
                </div>
            </header>

            {/* RESPONSIVE: Changed to flex-col on mobile, lg:flex-row on large screens. Optimized height for better scrolling */}
            <main className="flex flex-col lg:flex-row gap-3 sm:gap-4 max-w-7xl mx-auto h-[calc(100vh-120px)] overflow-hidden p-3 sm:p-4">
                {/* --- Editor Panel --- */}
                {/* RESPONSIVE: Added min-h-[50vh] for a better mobile experience, optimized scrolling */}
                <div className="w-full lg:w-1/2 bg-zinc-900/50 border border-zinc-800 text-zinc-200 rounded-xl overflow-hidden flex flex-col min-h-[50vh] lg:min-h-0">
                    <div className="flex-1 overflow-y-auto p-2 sm:p-4">
                        {/* --- Document Switcher --- */}
                        <div className="p-3 sm:p-4 mb-3 sm:mb-4 rounded-lg bg-zinc-800/50">
                            <h3 className="text-base sm:text-lg font-bold text-white mb-3">Document Versions</h3>
                            <div className="flex flex-wrap items-center gap-2">
                                {fullProjectData.content.map((_, index) => (
                                    <div key={index} className="relative group">
                                        <button
                                            onClick={() => setActiveContentIndex(index)}
                                            className={`px-3 sm:px-4 py-2 text-xs font-semibold rounded-md transition-colors will-change-transform ${activeContentIndex === index ? 'bg-blue-600 text-white' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'}`}
                                        >
                                            Version {index + 1}
                                        </button>
                                        <button onClick={() => deleteDocument(index)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs">&times;</button>
                                    </div>
                                ))}
                                <div className="relative group">
                                    <button className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-md text-xs font-semibold transition-colors will-change-transform"><PlusIcon /> Add</button>
                                    <div className="absolute top-full left-0 w-40 bg-zinc-700 border border-zinc-600 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity invisible group-hover:visible z-20">
                                        <a onClick={() => addDocument('blank')} className="block px-4 py-2 text-xs text-white hover:bg-zinc-600 cursor-pointer">Add Blank</a>
                                        <a onClick={() => addDocument('copy')} className="block px-4 py-2 text-xs text-white hover:bg-zinc-600 cursor-pointer">Copy First Document</a>
                                    </div>
                                </div>
                            </div>
                        </div>

                    <div className="space-y-6">
                        {activeContent && (
                            <>
                                <div className="p-4 rounded-lg bg-zinc-800/50">
                                    <h3 className="text-lg font-bold text-white mb-4">Exam Headers (Version {activeContentIndex + 1})</h3>
                                    <div className="space-y-3">
                                        {activeContent.headers.map((header, index) => {
                                            const field = Object.keys(header).find(key => key !== 'styles');
                                            const valueUpdater = (val) => updateActiveContentData(d => { d.headers[index][field] = field === 'totalMarks' ? parseInt(val) || 0 : val; });
                                            const styleUpdater = (type, val) => updateActiveContentData(d => {
                                                const item = d.headers[index];
                                                let styles = [...(item.styles || [])]; // Create a copy of existing styles

                                                console.log(`Updating header ${index} (${field}) - Type: ${type}, Value: ${val}, Current styles:`, styles);

                                                if (type === 'bold') {
                                                    // Remove existing font weight styles
                                                    styles = styles.filter(s => !s.startsWith('font-'));
                                                    // Add new font weight
                                                    if (val) {
                                                        styles.push(val);
                                                    }
                                                } else if (type === 'underline') {
                                                    // Remove existing underline
                                                    styles = styles.filter(s => s !== 'underline');
                                                    // Add underline if specified
                                                    if (val) {
                                                        styles.push(val);
                                                    }
                                                } else if (type === 'fontSize') {
                                                    // Remove existing text size styles
                                                    styles = styles.filter(s => !s.startsWith('text-'));
                                                    // Add new text size
                                                    if (val) {
                                                        styles.push(val);
                                                    }
                                                }

                                                item.styles = styles;
                                                console.log(`Updated header ${index} (${field}) - New styles:`, styles);
                                            });
                                            return (
                                                <div key={`${activeContentIndex}-${index}`} className="flex flex-col sm:flex-row gap-2">
                                                    <input type={field === 'totalMarks' ? 'number' : 'text'} className="flex-grow bg-zinc-700 border-2 border-zinc-600 rounded-md p-2.5 text-white placeholder-zinc-400" value={header[field] || ""} onChange={e => valueUpdater(e.target.value)} placeholder={headerPlaceholders[field] || `Enter ${field}`} />
                                                    <StyleControls currentStyles={header.styles} onStyleChange={styleUpdater} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="p-4 rounded-lg bg-zinc-800/50">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold text-white">Questions</h3>
                                        <button onClick={addMainQuestion} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-semibold shadow-md"><PlusIcon /> Add Question</button>
                                    </div>
                                    <div className="space-y-4">
                                        {activeContent.questions.map((q, qIndex) => (
                                            <div key={`${activeContentIndex}-${qIndex}`} className="border border-zinc-700 rounded-lg p-3 bg-zinc-900 space-y-3">
                                                <div className="flex items-start gap-2">
                                                    <span className="font-bold text-white text-lg mt-2">{q.index}.</span>
                                                    <div className="w-full space-y-2">
                                                        <input type="text" className="w-full bg-zinc-700 border-2 border-zinc-600 rounded-md p-2 text-white" placeholder="Main Question" value={q.text} onChange={e => updateActiveContentData(d => { d.questions[qIndex].text = e.target.value; })} />
                                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                                            <div className="flex gap-2 items-center">
                                                                <input type="number" className="w-24 bg-zinc-700 border-2 border-zinc-600 rounded-md p-2" placeholder="Marks" value={q.marks} onChange={e => updateActiveContentData(d => { d.questions[qIndex].marks = parseInt(e.target.value) || 0; })} />
                                                                <StyleControls currentStyles={q.styles} onStyleChange={(type, val) => updateActiveContentData(d => { let item = d.questions[qIndex]; let styles = item.styles || []; let filtered = styles.filter(s => !(type === 'bold' && s.startsWith('font-')) && !(type === 'underline' && s === 'underline') && !(type === 'fontSize' && s.startsWith('text-'))); if (val && val !== 'font-normal') filtered.push(val); item.styles = filtered; })} />
                                                            </div>
                                                            <div className="flex gap-2 self-end sm:self-center">
                                                                <button onClick={() => addSubQuestion(qIndex)} className="flex items-center gap-1.5 bg-zinc-600 hover:bg-zinc-500 text-white px-2.5 py-1.5 rounded-md text-xs font-semibold"><PlusIcon />Sub</button>
                                                                <button onClick={() => deleteQuestion([qIndex])} className="flex items-center gap-1.5 bg-red-600/80 hover:bg-red-600 text-white px-2.5 py-1.5 rounded-md text-xs font-semibold"><TrashIcon />Del</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                {q.options?.map((subQ, subQIndex) => (
                                                    <div key={`${activeContentIndex}-${qIndex}-${subQIndex}`} className="ml-6 pl-4 border-l-2 border-zinc-700 space-y-2">
                                                        <div className="flex items-start gap-2">
                                                            <span className="font-semibold text-blue-300 mt-2">({subQ.index})</span>
                                                            <div className="w-full space-y-2">
                                                                <input type="text" className="w-full bg-zinc-700 border-2 border-zinc-600 rounded-md p-2" placeholder="Sub Question" value={subQ.text} onChange={e => updateActiveContentData(d => { d.questions[qIndex].options[subQIndex].text = e.target.value; })} />
                                                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                                                    <div className="flex gap-2 items-center">
                                                                        <input type="number" className="w-24 bg-zinc-700 border-2 border-zinc-600 rounded-md p-2" placeholder="Marks" value={subQ.marks} onChange={e => updateActiveContentData(d => { d.questions[qIndex].options[subQIndex].marks = parseInt(e.target.value) || 0; })} />
                                                                        <StyleControls currentStyles={subQ.styles} onStyleChange={(type, val) => updateActiveContentData(d => { let item = d.questions[qIndex].options[subQIndex]; let styles = item.styles || []; let filtered = styles.filter(s => !(type === 'bold' && s.startsWith('font-')) && !(type === 'underline' && s === 'underline') && !(type === 'fontSize' && s.startsWith('text-'))); if (val && val !== 'font-normal') filtered.push(val); item.styles = filtered; })} />
                                                                    </div>
                                                                    <div className="flex gap-2 self-end sm:self-center">
                                                                        <button onClick={() => addSubSubQuestion(qIndex, subQIndex)} className="flex items-center gap-1.5 bg-zinc-600 hover:bg-zinc-500 text-white px-2.5 py-1.5 rounded-md text-xs font-semibold"><PlusIcon />Sub-Sub</button>
                                                                        <button onClick={() => deleteQuestion([qIndex, subQIndex])} className="flex items-center gap-1.5 bg-red-600/80 hover:bg-red-600 text-white px-2.5 py-1.5 rounded-md text-xs font-semibold"><TrashIcon />Del</button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {subQ.options?.map((subSubQ, subSubQIndex) => (
                                                            <div key={`${activeContentIndex}-${qIndex}-${subQIndex}-${subSubQIndex}`} className="ml-6 pl-4 border-l-2 border-zinc-600">
                                                                <div className="flex items-start gap-2">
                                                                    <span className="font-medium text-purple-300 mt-2">({subSubQ.index})</span>
                                                                    <div className="w-full space-y-2">
                                                                        <input type="text" className="w-full bg-zinc-700 border-2 border-zinc-600 rounded-md p-2" placeholder="Sub-Sub Question" value={subSubQ.text} onChange={e => updateActiveContentData(d => { d.questions[qIndex].options[subQIndex].options[subSubQIndex].text = e.target.value; })} />
                                                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                                                            <div className="flex gap-2 items-center">
                                                                                <input type="number" className="w-24 bg-zinc-700 border-2 border-zinc-600 rounded-md p-2" placeholder="Marks" value={subSubQ.marks} onChange={e => updateActiveContentData(d => { d.questions[qIndex].options[subQIndex].options[subSubQIndex].marks = parseInt(e.target.value) || 0; })} />
                                                                                <StyleControls currentStyles={subSubQ.styles} onStyleChange={(type, val) => updateActiveContentData(d => { let item = d.questions[qIndex].options[subQIndex].options[subSubQIndex]; let styles = item.styles || []; let filtered = styles.filter(s => !(type === 'bold' && s.startsWith('font-')) && !(type === 'underline' && s === 'underline') && !(type === 'fontSize' && s.startsWith('text-'))); if (val && val !== 'font-normal') filtered.push(val); item.styles = filtered; })} />
                                                                            </div>
                                                                            <button onClick={() => deleteQuestion([qIndex, subQIndex, subSubQIndex])} className="flex items-center gap-1.5 bg-red-600/80 hover:bg-red-600 text-white px-2.5 py-1.5 rounded-md text-xs font-semibold self-end sm:self-center"><TrashIcon />Del</button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    </div>
                </div>

                {/* --- Preview Panel --- */}
                {/* RESPONSIVE: Added min-h-[70vh] for a better mobile experience, optimized scrolling */}
                <div className="w-full lg:w-1/2 bg-white text-black overflow-hidden rounded-xl flex flex-col min-h-[70vh] lg:min-h-0">
                    <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                        <PreviewPanel key={activeContentIndex} ref={previewRef} projectData={activeContent} />
                    </div>
                </div>
            </main>

            {/* Hidden container for multi-page export */}
            {isPreparingExport && (
                <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                    <div 
                        ref={multiPagePreviewRef}
                        className="bg-white"
                        style={{
                            // Ensure same styling context as main preview
                            fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
                            lineHeight: '1.4',
                            // Remove default margins/padding for multi-page export
                            margin: 0,
                            padding: 0
                        }}
                    >
                        {fullProjectData.content.map((doc, index) => (
                            <div
                                key={index}
                                style={{
                                    pageBreakBefore: index > 0 ? 'always' : 'auto',
                                    pageBreakInside: 'avoid',
                                    // Remove margin between pages
                                    margin: 0,
                                    padding: index === 0 ? '15mm 10mm' : '0 10mm 15mm 10mm', // First page: normal padding, others: no top padding
                                    boxSizing: 'border-box',
                                    minHeight: '297mm',
                                    width: '100%',
                                    maxWidth: '210mm'
                                }}
                                className="bg-white text-black font-serif"
                            >
                                {/* Render content without PreviewPanel wrapper to avoid double padding */}
                                <div>
                                    {/* Header Section */}
                                    <header className="space-y-3 mb-6">
                                        <div className="flex justify-between items-center text-sm font-sans border-b pb-2">
                                            <span className={`${doc.headers[7]?.styles?.join(' ')}`}>
                                                {doc.headers[7]?.subjectCode}
                                            </span>
                                            <span className={`${doc.headers[8]?.styles?.join(' ')}`}>
                                                [{doc.headers[8]?.specialNumber}]
                                            </span>
                                        </div>
                                        
                                        <div className="text-center space-y-2 my-6">
                                            <h1 className={`${doc.headers[0]?.styles?.join(' ')} leading-tight`}>
                                                {doc.headers[0]?.courseName}
                                            </h1>
                                            <h2 className={`${doc.headers[1]?.styles?.join(' ')}`}>
                                                {doc.headers[1]?.examinationType}
                                            </h2>
                                            <h3 className={`${doc.headers[2]?.styles?.join(' ')}`}>
                                                {doc.headers[2]?.semesterYear}
                                            </h3>
                                            <h4 className={`${doc.headers[3]?.styles?.join(' ')} mt-3`}>
                                                {doc.headers[3]?.subjectName}
                                            </h4>
                                        </div>
                                        
                                        <div className="flex justify-between items-center text-sm border-t border-b py-2 mt-4">
                                            <span className={`${doc.headers[5]?.styles?.join(' ')}`}>
                                                {doc.headers[5]?.time && `Time: ${doc.headers[5]?.time}`}
                                            </span>
                                            <span className={`${doc.headers[4]?.styles?.join(' ')}`}>
                                                {doc.headers[4]?.totalMarks && `Maximum Marks: ${doc.headers[4]?.totalMarks}`}
                                            </span>
                                        </div>
                                        
                                        {doc.headers[6]?.notes && (
                                            <div className={`text-sm mt-3 ${doc.headers[6]?.styles?.join(' ')}`}>
                                                {doc.headers[6]?.notes}
                                            </div>
                                        )}
                                    </header>

                                    {/* Questions Section */}
                                    <main className="space-y-6">
                                        {doc.questions?.map(q => (
                                            <div key={q.index} className="mb-4 mt-6">
                                                {q.text && (
                                                    <div className="flex justify-between items-start gap-4 ml-0">
                                                        <div className="flex-grow">
                                                            <p className={`${q.styles?.join(' ')} leading-relaxed`}>
                                                                <span className="font-bold text-base mr-2">{q.index}.</span>
                                                                {q.text}
                                                            </p>
                                                        </div>
                                                        {q.marks > 0 && (
                                                            <div className="flex-shrink-0 ml-4">
                                                                <span className="text-sm text-gray-700">
                                                                    {q.marks}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {/* Sub-questions */}
                                                {q.options?.map(subQ => (
                                                    <div key={subQ.index} className="mb-3 mt-3">
                                                        {subQ.text && (
                                                            <div className="flex justify-between items-start gap-4 ml-6">
                                                                <div className="flex-grow">
                                                                    <p className={`${subQ.styles?.join(' ')} leading-relaxed`}>
                                                                        <span className="font-semibold mr-2">({subQ.index})</span>
                                                                        {subQ.text}
                                                                    </p>
                                                                </div>
                                                                {subQ.marks > 0 && (
                                                                    <div className="flex-shrink-0 ml-4">
                                                                        <span className="text-sm text-gray-700">
                                                                            {subQ.marks}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        {/* Sub-sub-questions */}
                                                        {subQ.options?.map(subSubQ => (
                                                            <div key={subSubQ.index} className="mb-2 mt-2">
                                                                {subSubQ.text && (
                                                                    <div className="flex justify-between items-start gap-4 ml-12">
                                                                        <div className="flex-grow">
                                                                            <p className={`${subSubQ.styles?.join(' ')} leading-relaxed`}>
                                                                                <span className="font-medium mr-1">({subSubQ.index})</span>
                                                                                {subSubQ.text}
                                                                            </p>
                                                                        </div>
                                                                        {subSubQ.marks > 0 && (
                                                                            <div className="flex-shrink-0 ml-4">
                                                                                <span className="text-sm text-gray-700">
                                                                                    {subSubQ.marks}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </main>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* AI Chat Sidebar */}
            <AIChatSidebar
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                fullProjectData={fullProjectData}
                onApplyChanges={applyAIChanges}
                activeContentIndex={activeContentIndex}
            />
        </div>
        </AuthGuard>
    );
}