"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import toast from 'react-hot-toast';
import PreviewPanel from "../../../component/PreviewPanel"; // Ensure this path is correct

// --- SVG Icons for Buttons ---
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>;
const ExportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;

// --- Reusable component for styling controls ---
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
        </select>
    </div>
);

export default function EditProjectPage() {
    const params = useParams();
    const projectId = params.projectId;

    const [projectData, setProjectData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const previewRef = useRef(null);
    const [isExporting, setIsExporting] = useState(false);
    const [pageSize, setPageSize] = useState('A4');

    useEffect(() => {
        if (!projectId) return;

        const fetchProjectData = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/projectedit?projectId=${projectId}`);
                if (!response.ok) throw new Error('Failed to fetch project data.');
                
                const data = await response.json();
                if (data.content && data.content.length > 0) {
                    setProjectData(data.content[0]);
                } else {
                    setProjectData({
                        headers: [
                            { courseName: "", styles: ["text-lg", "font-bold"] },
                            { examinationType: "Term-End Examination", styles: ["text-base", "font-bold"] },
                            { semesterYear: "August, 2025", styles: ["text-base", "font-bold"] },
                            { subjectName: "", styles: ["text-base", "font-bold"] },
                            { totalMarks: 100, styles: ["text-sm", "font-bold"] },
                            { time: "3 hours", styles: ["text-sm", "font-bold"] },
                            { notes: "Note: All questions are compulsory.", styles: ["text-sm", "italic"] }
                        ],
                        questions: []
                    });
                }
            } catch (error) {
                console.error("Fetch error:", error);
                toast.error(error.message || "Could not load project.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProjectData();
    }, [projectId]);

    const saveProject = async () => {
        if (!projectData) return;
        setIsSaving(true);
        const loadingToast = toast.loading('Saving project...');

        try {
            const response = await fetch(`/api/projectedit?projectId=${projectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: [projectData] })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save project.');
            }
            toast.success('Project saved successfully!', { id: loadingToast });
        } catch (error) {
            console.error("Save error:", error);
            toast.error(error.message, { id: loadingToast });
        } finally {
            setIsSaving(false);
        }
    };

    const handleExportPDF = async () => {
        setIsExporting(true);
        const loadingToast = toast.loading('Generating PDF...');

        const generateCompleteHTML = () => {
            if (!previewRef.current) {
                toast.error("Preview content is not available.");
                return null;
            }
            const contentHTML = previewRef.current.innerHTML;
            let allCSS = "";
            for (const sheet of document.styleSheets) {
                try {
                    for (const rule of sheet.cssRules) allCSS += rule.cssText;
                } catch (e) {
                    console.warn("Could not read CSS rules:", e);
                }
            }
            const cleanedCSS = allCSS.replace(/lab\([^)]+\)/g, '#000').replace(/oklab\([^)]+\)/g, '#000').replace(/color-mix\([^)]+\)/g, '#000');
            return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Export</title><style>${cleanedCSS}</style></head><body>${contentHTML}</body></html>`;
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
                body: JSON.stringify({ htmlContent, format: pageSize }),
            });

            if (!response.ok) throw new Error('PDF generation failed on the server.');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${projectId}-export.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success('PDF downloaded successfully!', { id: loadingToast });
        } catch (error) {
            console.error("PDF Export Error:", error);
            toast.error(error.message || 'Failed to export PDF.', { id: loadingToast });
        } finally {
            setIsExporting(false);
        }
    };

    // A single, generic function to update the deeply nested state immutably
    const updateProjectData = (updater) => {
        setProjectData(prevData => {
            const newData = JSON.parse(JSON.stringify(prevData));
            updater(newData);
            return newData;
        });
    };
    
    // --- Data Manipulation Functions ---
    const addMainQuestion = () => updateProjectData(data => {
        data.questions.push({ index: data.questions.length + 1, styles: ["text-base"], text: "", marks: 0, options: [] });
    });

    const addSubQuestion = (qIndex) => updateProjectData(data => {
        const question = data.questions[qIndex];
        const subIndex = String.fromCharCode(97 + question.options.length);
        question.options.push({ index: subIndex, styles: ["text-base"], text: "", marks: 0, options: [] });
    });

    const addSubSubQuestion = (qIndex, subQIndex) => updateProjectData(data => {
        const subQuestion = data.questions[qIndex].options[subQIndex];
        if (!subQuestion.options) subQuestion.options = [];
        const roman = ['i', 'ii', 'iii', 'iv', 'v'];
        const index = roman[subQuestion.options.length] || `${subQuestion.options.length + 1}`;
        subQuestion.options.push({ index, styles: ["text-base"], text: "", marks: 0 });
    });
    
    const deleteQuestion = (indices) => updateProjectData(data => {
        if (indices.length === 1) { // Main question
            data.questions.splice(indices[0], 1);
            data.questions.forEach((q, i) => q.index = i + 1);
        } else if (indices.length === 2) { // Sub question
            const mainQ = data.questions[indices[0]];
            mainQ.options.splice(indices[1], 1);
            mainQ.options.forEach((sq, i) => sq.index = String.fromCharCode(97 + i));
        } else if (indices.length === 3) { // Sub-sub question
            data.questions[indices[0]].options[indices[1]].options.splice(indices[2], 1);
        }
    });

    if (isLoading || !projectData) {
        return <div className="flex items-center justify-center min-h-screen bg-zinc-900 text-white text-xl">Loading Editor...</div>;
    }

    return (
        <div className="bg-zinc-900 text-zinc-200 min-h-screen font-sans">
            <header className="p-4 sticky top-0 bg-zinc-900/80 backdrop-blur-sm z-10 border-b border-zinc-800">
                <div className="flex flex-wrap items-center justify-between gap-4 max-w-7xl mx-auto">
                    <h1 className="text-xl font-bold">Editing: <span className="text-blue-400">{projectId}</span></h1>
                    <div className="flex items-center gap-2">
                         <div className="flex items-center gap-2 bg-zinc-800 p-1.5 rounded-lg border border-zinc-700">
                            <select
  value={pageSize}
  onChange={(e) => setPageSize(e.target.value)}
  className="bg-zinc-700 border-zinc-600 rounded-md px-2 py-1.5 text-xs text-white"
  aria-label="Page Size"
>
  {/* --- Standard A-Series --- */}
  <option value="A3">A3</option>
  <option value="A4">A4</option>
  <option value="A5">A5</option>
  <option value="A6">A6</option>
  
  {/* --- Standard B-Series --- */}
  <option value="B4">B4</option>
  <option value="B5">B5</option>
  
  {/* --- US Formats --- */}
  <option value="Letter">Letter</option>
  <option value="Legal">Legal</option>
  <option value="Tabloid">Tabloid</option>
</select>
                            <button onClick={handleExportPDF} disabled={isExporting} className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded-md font-semibold text-xs shadow-lg flex items-center gap-2 disabled:bg-zinc-600 disabled:cursor-not-allowed">
                                <ExportIcon /> {isExporting ? 'Exporting...' : 'Export PDF'}
                            </button>
                        </div>
                        <button onClick={saveProject} disabled={isSaving} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-semibold shadow-lg disabled:bg-zinc-600 disabled:cursor-not-allowed">
                            {isSaving ? 'Saving...' : 'Save Project'}
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex flex-col lg:flex-row p-4 h-[calc(100vh-77px)] gap-4 max-w-7xl mx-auto">
                {/* --- Editor Panel --- */}
                <div className="w-full lg:w-1/2 bg-zinc-900/50 border border-zinc-800 text-zinc-200 rounded-xl overflow-y-auto p-2 sm:p-4">
                    <div className="space-y-6">
                        {/* Headers Section */}
                        <div className="p-4 rounded-lg bg-zinc-800/50">
                            <h3 className="text-lg font-bold text-white mb-4">Exam Headers</h3>
                            <div className="space-y-3">
                                {projectData.headers.map((header, index) => {
                                    const field = Object.keys(header).find(key => key !== 'styles');
                                    const valueUpdater = (val) => updateProjectData(d => { d.headers[index][field] = field === 'totalMarks' ? parseInt(val) || 0 : val; });
                                    const styleUpdater = (type, val) => updateProjectData(d => {
                                        const item = d.headers[index];
                                        let styles = item.styles || [];
                                        let filtered = styles.filter(s => !(type === 'bold' && s.startsWith('font-')) && !(type === 'underline' && s === 'underline') && !(type === 'fontSize' && s.startsWith('text-')));
                                        if (val && val !== 'font-normal') filtered.push(val);
                                        item.styles = filtered;
                                    });
                                    return (
                                        <div key={index} className="flex flex-col sm:flex-row gap-2">
                                            <input type={field === 'totalMarks' ? 'number' : 'text'} className="flex-grow bg-zinc-700 border-2 border-zinc-600 rounded-md p-2.5 text-white placeholder-zinc-400" value={header[field] || ""} onChange={e => valueUpdater(e.target.value)} />
                                            <StyleControls currentStyles={header.styles} onStyleChange={styleUpdater} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Questions Section */}
                        <div className="p-4 rounded-lg bg-zinc-800/50">
                             <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-white">Questions</h3>
                                <button onClick={addMainQuestion} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-semibold shadow-md"><PlusIcon /> Add Question</button>
                            </div>
                            <div className="space-y-4">
                                {projectData.questions.map((q, qIndex) => (
                                    <div key={qIndex} className="border border-zinc-700 rounded-lg p-3 bg-zinc-900 space-y-3">
                                        <div className="flex items-start gap-2">
                                            <span className="font-bold text-white text-lg mt-2">{q.index}.</span>
                                            <div className="w-full space-y-2">
                                                <input type="text" className="w-full bg-zinc-700 border-2 border-zinc-600 rounded-md p-2 text-white" placeholder="Main Question" value={q.text} onChange={e => updateProjectData(d => { d.questions[qIndex].text = e.target.value; })}/>
                                                <div className="flex justify-between items-center">
                                                    <div className="flex gap-2 items-center">
                                                        <input type="number" className="w-24 bg-zinc-700 border-2 border-zinc-600 rounded-md p-2" placeholder="Marks" value={q.marks} onChange={e => updateProjectData(d => { d.questions[qIndex].marks = parseInt(e.target.value) || 0; })}/>
                                                        <StyleControls currentStyles={q.styles} onStyleChange={(type, val) => updateProjectData(d => { let item = d.questions[qIndex]; let styles = item.styles || []; let filtered = styles.filter(s => !(type === 'bold' && s.startsWith('font-')) && !(type === 'underline' && s === 'underline') && !(type === 'fontSize' && s.startsWith('text-'))); if (val && val !== 'font-normal') filtered.push(val); item.styles = filtered; })}/>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => addSubQuestion(qIndex)} className="flex items-center gap-1.5 bg-zinc-600 hover:bg-zinc-500 text-white px-2.5 py-1.5 rounded-md text-xs font-semibold"><PlusIcon/>Sub</button>
                                                        <button onClick={() => deleteQuestion([qIndex])} className="flex items-center gap-1.5 bg-red-600/80 hover:bg-red-600 text-white px-2.5 py-1.5 rounded-md text-xs font-semibold"><TrashIcon/>Del</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {q.options?.map((subQ, subQIndex) => (
                                            <div key={subQIndex} className="ml-6 pl-4 border-l-2 border-zinc-700 space-y-2">
                                                <div className="flex items-start gap-2">
                                                    <span className="font-semibold text-blue-300 mt-2">({subQ.index})</span>
                                                    <div className="w-full space-y-2">
                                                        <input type="text" className="w-full bg-zinc-700 border-2 border-zinc-600 rounded-md p-2" placeholder="Sub Question" value={subQ.text} onChange={e => updateProjectData(d => { d.questions[qIndex].options[subQIndex].text = e.target.value; })}/>
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex gap-2 items-center">
                                                                <input type="number" className="w-24 bg-zinc-700 border-2 border-zinc-600 rounded-md p-2" placeholder="Marks" value={subQ.marks} onChange={e => updateProjectData(d => { d.questions[qIndex].options[subQIndex].marks = parseInt(e.target.value) || 0; })}/>
                                                                <StyleControls currentStyles={subQ.styles} onStyleChange={(type, val) => updateProjectData(d => { let item = d.questions[qIndex].options[subQIndex]; let styles = item.styles || []; let filtered = styles.filter(s => !(type === 'bold' && s.startsWith('font-')) && !(type === 'underline' && s === 'underline') && !(type === 'fontSize' && s.startsWith('text-'))); if (val && val !== 'font-normal') filtered.push(val); item.styles = filtered; })}/>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button onClick={() => addSubSubQuestion(qIndex, subQIndex)} className="flex items-center gap-1.5 bg-zinc-600 hover:bg-zinc-500 text-white px-2.5 py-1.5 rounded-md text-xs font-semibold"><PlusIcon/>Sub-Sub</button>
                                                                <button onClick={() => deleteQuestion([qIndex, subQIndex])} className="flex items-center gap-1.5 bg-red-600/80 hover:bg-red-600 text-white px-2.5 py-1.5 rounded-md text-xs font-semibold"><TrashIcon/>Del</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                {subQ.options?.map((subSubQ, subSubQIndex) => (
                                                    <div key={subSubQIndex} className="ml-6 pl-4 border-l-2 border-zinc-600">
                                                        <div className="flex items-start gap-2">
                                                            <span className="font-medium text-purple-300 mt-2">({subSubQ.index})</span>
                                                            <div className="w-full space-y-2">
                                                                <input type="text" className="w-full bg-zinc-700 border-2 border-zinc-600 rounded-md p-2" placeholder="Sub-Sub Question" value={subSubQ.text} onChange={e => updateProjectData(d => { d.questions[qIndex].options[subQIndex].options[subSubQIndex].text = e.target.value; })}/>
                                                                <div className="flex justify-between items-center">
                                                                    <div className="flex gap-2 items-center">
                                                                        <input type="number" className="w-24 bg-zinc-700 border-2 border-zinc-600 rounded-md p-2" placeholder="Marks" value={subSubQ.marks} onChange={e => updateProjectData(d => { d.questions[qIndex].options[subQIndex].options[subSubQIndex].marks = parseInt(e.target.value) || 0; })}/>
                                                                        <StyleControls currentStyles={subSubQ.styles} onStyleChange={(type, val) => updateProjectData(d => { let item = d.questions[qIndex].options[subQIndex].options[subSubQIndex]; let styles = item.styles || []; let filtered = styles.filter(s => !(type === 'bold' && s.startsWith('font-')) && !(type === 'underline' && s === 'underline') && !(type === 'fontSize' && s.startsWith('text-'))); if (val && val !== 'font-normal') filtered.push(val); item.styles = filtered; })}/>
                                                                    </div>
                                                                    <button onClick={() => deleteQuestion([qIndex, subQIndex, subSubQIndex])} className="flex items-center gap-1.5 bg-red-600/80 hover:bg-red-600 text-white px-2.5 py-1.5 rounded-md text-xs font-semibold"><TrashIcon/>Del</button>
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
                    </div>
                </div>

                {/* --- Preview Panel --- */}
                <div className="w-full lg:w-1/2 bg-white text-black overflow-y-auto p-4 rounded-xl flex justify-center">
                    <PreviewPanel ref={previewRef} projectData={projectData} />
                </div>
            </main>
        </div>
    );
}