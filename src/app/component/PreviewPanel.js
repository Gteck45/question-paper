// components/PreviewPanel.js

import React from 'react';

// A helper function to render questions recursively, now acting as a sub-component
const Question = ({ question, level = 0 }) => {
    const indentations = ['ml-0', 'ml-8', 'ml-16'];
    const indentClass = indentations[level] || 'ml-16';

    let indexDisplay;
    if (level === 0) indexDisplay = <span className="font-bold">{question.index}.</span>;
    else if (level === 1) indexDisplay = <span className="font-semibold">({question.index})</span>;
    else indexDisplay = <span className="font-medium">({question.index})</span>;

    return (
        // Key is on the top-level element
        <div key={question.index}>
            {question.text && (
                <div className={`flex justify-between items-start gap-4 mt-2 ${indentClass}`}>
                    <p className={`flex-grow ${question.styles?.join(' ')}`}>
                        {indexDisplay} {question.text}
                    </p>
                    {question.marks > 0 && <span className="font-bold whitespace-nowrap">{question.marks}</span>}
                </div>
            )}
            {/* Recursively render sub-questions */}
            {question.options?.map(subQ => (
                <Question key={subQ.index} question={subQ} level={level + 1} />
            ))}
        </div>
    );
};

const PreviewPanel = React.forwardRef(({ projectData }, ref) => {
    if (!projectData) {
        return null;
    }

    // Destructure headers for easier access, providing default values
    const [
        courseName = {},
        examinationType = {},
        semesterYear = {},
        subjectName = {},
        totalMarks = {},
        time = {},
        notes = {}
    ] = projectData.headers;

    // Safely extract subject code
    const subjectCode = subjectName.subjectName?.split(':')[0] || '';

    return (
        // A4-like container with a ref for the export function
        <div ref={ref} id="preview-content" className="bg-white text-black font-serif shadow-lg w-full max-w-[210mm] min-h-[297mm] p-12 border border-zinc-300">
            
            {/* --- Header Section --- */}
            <header className="space-y-3">
                <div className="flex justify-between items-center text-sm font-sans font-bold">
                    <span>{subjectCode}</span>
                    <span>[]</span>
                </div>
                <div className="text-center font-bold space-y-1 mt-4">
                    <h1 className={courseName.styles?.join(' ')}>{courseName.courseName}</h1>
                    <h2 className={examinationType.styles?.join(' ')}>{examinationType.examinationType}</h2>
                    <h3 className={semesterYear.styles?.join(' ')}>{semesterYear.semesterYear}</h3>
                    <h4 className={subjectName.styles?.join(' ')}>{subjectName.subjectName}</h4>
                </div>
                <div className="flex justify-between items-center font-bold text-sm mt-4">
                    <span className={time.styles?.join(' ')}>Time: {time.time || '3 hours'}</span>
                    <span className={totalMarks.styles?.join(' ')}>Maximum Marks: {totalMarks.totalMarks || '100'}</span>
                </div>
                <div className={`text-sm italic mt-2 ${notes.styles?.join(' ')}`}>
                    {notes.notes}
                </div>
            </header>

            <hr className="my-6 border-t-2 border-black" />

            {/* --- Questions Section --- */}
            <main className="space-y-4">
                {projectData.questions.map(q => (
                    <Question key={q.index} question={q} level={0} />
                ))}
            </main>

            {/* --- Footer Section --- */}
            <footer className="mt-12 pt-4 border-t border-zinc-400 flex justify-between text-sm font-sans">
                <span>{subjectCode}</span>
                <span>P.T.O.</span>
            </footer>
        </div>
    );
});

// Set a display name for the component for easier debugging
PreviewPanel.displayName = 'PreviewPanel';

export default PreviewPanel;