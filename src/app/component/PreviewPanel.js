// components/PreviewPanel.js

import React, { memo, useMemo } from 'react';

// Enhanced Question component with better typography and spacing - Memoized for performance
const Question = memo(({ question, level = 0 }) => {
    const indentations = ['ml-0', 'ml-6', 'ml-12'];
    const indentClass = indentations[level] || 'ml-12';
    
    // Enhanced spacing based on question level
    const spacingClasses = {
        0: 'mb-4 mt-6', // Main questions
        1: 'mb-3 mt-3', // Sub questions
        2: 'mb-2 mt-2'  // Sub-sub questions
    };
    
    const spacingClass = spacingClasses[level] || 'mb-2 mt-2';

    const indexDisplay = useMemo(() => {
        if (level === 0) {
            return <span className="font-bold text-base mr-2">{question.index}.</span>;
        } else if (level === 1) {
            return <span className="font-semibold mr-2">({question.index})</span>;
        } else {
            return <span className="font-medium mr-1">({question.index})</span>;
        }
    }, [question.index, level]);

    const styleClasses = useMemo(() => 
        question.styles?.join(' ') || '', 
        [question.styles]
    );

    return (
        <div className={spacingClass}>
            {question.text && (
                <div className={`flex justify-between items-start gap-4 ${indentClass}`}>
                    <div className="flex-grow">
                        <p className={`${styleClasses} leading-relaxed`}>
                            {indexDisplay}
                            {question.text}
                        </p>
                    </div>
                    {question.marks > 0 && (
                        <div className="flex-shrink-0 ml-4">
                            <span className="text-sm text-gray-700">
                                {question.marks}
                            </span>
                        </div>
                    )}
                </div>
            )}
            {/* Recursively render sub-questions with improved spacing */}
            <div className={level > 0 ? 'mt-2' : 'mt-3'}>
                {question.options?.map(subQ => (
                    <Question key={subQ.index} question={subQ} level={level + 1} />
                ))}
            </div>
        </div>
    );
});

Question.displayName = 'Question';

const PreviewPanel = memo(React.forwardRef(({ projectData }, ref) => {
    const memoizedData = useMemo(() => {
        if (!projectData) return null;

        // Destructure headers according to the provided JSON structure
        const [
            courseName = {},
            examinationType = {},
            semesterYear = {},
            subjectName = {},
            totalMarks = {},
            time = {},
            notes = {},
            subjectCode = {},
            specialNumber = {}
        ] = projectData.headers;

        return {
            headers: {
                courseName,
                examinationType,
                semesterYear,
                subjectName,
                totalMarks,
                time,
                notes,
                subjectCode,
                specialNumber
            },
            questions: projectData.questions
        };
    }, [projectData]);

    if (!memoizedData) {
        return null;
    }

    const { headers, questions } = memoizedData;

    return (
        // Enhanced A4-like container with better PDF optimization
        <div 
            ref={ref} 
            id="preview-content" 
            className="bg-white text-black font-serif w-full max-w-[210mm] min-h-[297mm] mx-auto"
            style={{
                // CSS for better PDF rendering with reduced padding
                padding: '15mm 10mm',
                boxSizing: 'border-box',
                lineHeight: '1.4',
                // Ensure proper page breaks
                pageBreakInside: 'avoid',
                // Better font rendering for PDF
                fontOpticalSizing: 'auto',
                textRendering: 'optimizeLegibility'
            }}
        >
            
            {/* --- Header Section --- */}
            <header className="space-y-3 mb-6">
                {/* Enhanced header with better spacing */}
                <div className="flex justify-between items-center text-sm font-sans border-b pb-2">
                    <span className={`${headers.subjectCode.styles?.join(' ')}`}>
                        {headers.subjectCode.subjectCode}
                    </span>
                    {headers.specialNumber.specialNumber && (
                        <span className={`${headers.specialNumber.styles?.join(' ')}`}>
                            [{headers.specialNumber.specialNumber}]
                        </span>
                    )}
                </div>

                {/* Centered institution/exam details */}
                <div className="text-center space-y-2 my-6">
                    <h1 className={`${headers.courseName.styles?.join(' ')} leading-tight`}>
                        {headers.courseName.courseName}
                    </h1>
                    <h2 className={`${headers.examinationType.styles?.join(' ')}`}>
                        {headers.examinationType.examinationType}
                    </h2>
                    <h3 className={`${headers.semesterYear.styles?.join(' ')}`}>
                        {headers.semesterYear.semesterYear}
                    </h3>
                    <h4 className={`${headers.subjectName.styles?.join(' ')} mt-3`}>
                        {headers.subjectName.subjectName}
                    </h4>
                </div>
                
                {/* Time and marks section with better layout */}
                <div className="flex justify-between items-center text-sm border-t border-b py-2 mt-4">
                    <span className={`${headers.time.styles?.join(' ')}`}>
                        {headers.time.time && `Time: ${headers.time.time}`}
                    </span>
                    <span className={`${headers.totalMarks.styles?.join(' ')}`}>
                        {headers.totalMarks.totalMarks && `Maximum Marks: ${headers.totalMarks.totalMarks}`}
                    </span>
                </div>
                
                {/* Instructions/notes */}
                {headers.notes.notes && (
                    <div className={`text-sm mt-3 ${headers.notes.styles?.join(' ')}`}>
                        {headers.notes.notes}
                    </div>
                )}
            </header>

            {/* --- Questions Section --- */}
            <main className="space-y-6">
                {questions.map(q => (
                    <Question key={q.index} question={q} level={0} />
                ))}
            </main>
        </div>
    );
}));

// Set a display name for the component for easier debugging
PreviewPanel.displayName = 'PreviewPanel';

export default PreviewPanel;