import React, { useEffect, useState, useRef } from "react";
import toast from 'react-hot-toast';

// --- SVG Icons for Buttons ---
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>;
const ExportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;

const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;

const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/></svg>;

const AttachIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>;

const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

const AIIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r="1"/></svg>;

// AI Chat Sidebar Component
const AIChatSidebar = ({ isOpen, onClose, fullProjectData, onApplyChanges, activeContentIndex = 0 }) => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'ai',
            content: "Hello! I'm Oblivor from the Galapagus galaxy. I can help you enhance your question paper. I have access to your current document context and can make intelligent suggestions based on what you're working on. Upload files or ask me to generate questions!",
            timestamp: new Date()
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [attachedFile, setAttachedFile] = useState(null);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleFileAttach = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Check file size (max 30MB)
            if (file.size > 30 * 1024 * 1024) {
                toast.error('File size must be less than 30MB');
                return;
            }
            setAttachedFile(file);
        }
    };

    const removeAttachedFile = () => {
        setAttachedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const sendMessage = async () => {
        if (!inputMessage.trim() && !attachedFile) return;

        // Get current document context
        const currentDocument = fullProjectData?.content?.[activeContentIndex];
        const currentDocumentContext = currentDocument ? {
            documentIndex: activeContentIndex,
            totalDocuments: fullProjectData.content.length,
            headers: currentDocument.headers,
            questions: currentDocument.questions,
            questionsCount: currentDocument.questions?.length || 0
        } : null;

        const userMessage = {
            id: Date.now() + Math.random(), // Ensure unique ID
            type: 'user',
            content: inputMessage,
            file: attachedFile?.name,
            timestamp: new Date(),
            context: currentDocumentContext ? `Working on Document ${activeContentIndex + 1} of ${fullProjectData.content.length}` : null
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        const currentInput = inputMessage;
        const currentFile = attachedFile;
        setInputMessage('');
        setAttachedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }

        try {
            const formData = new FormData();
            
            // Enhanced prompt with document context
            let enhancedPrompt = currentInput || 'Analyze the uploaded file and suggest improvements for my question paper';
            
            if (currentDocumentContext) {
                const contextInfo = `

CURRENT DOCUMENT CONTEXT:
- Working on Document ${activeContentIndex + 1} of ${fullProjectData.content.length}
- Current document has ${currentDocumentContext.questionsCount} questions
- Subject: ${currentDocument.headers?.[3]?.subjectName || 'Not specified'}
- Total Marks: ${currentDocument.headers?.[4]?.totalMarks || 'Not specified'}
- Exam Type: ${currentDocument.headers?.[1]?.examinationType || 'Not specified'}

Please consider this current document context when responding to my request: "${currentInput}"`;
                
                enhancedPrompt = contextInfo + '\n\nUser Request: ' + currentInput;
            }
            
            formData.append('prompt', enhancedPrompt);

            // Always send the full project data for context
            if (fullProjectData) {
                formData.append('questionPaperForUser', JSON.stringify(fullProjectData));
            }

            // Send the active content index
            formData.append('activeContentIndex', activeContentIndex.toString());

            if (currentFile) {
                formData.append('file', currentFile);
            }

            const response = await fetch('/api/generateai', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to get AI response');
            }

            const data = await response.json();

            // Enhanced error checking and validation
            if (data.error) {
                console.warn("API returned error:", data.error);
                // Show error message in chat but don't update the question paper
                const errorMessage = {
                    id: Date.now() + Math.random(),
                    type: 'ai',
                    content: data.message || data.answer || "I encountered an error while processing your request. Please try rephrasing your prompt or simplifying your request.",
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, errorMessage]);
                toast.error(data.message || "AI encountered an error. No changes made to your question paper.");
                return;
            }

            // Comprehensive validation function for question paper structure
            const validateQuestionPaperStructure = (questionPaper) => {
                if (!questionPaper) {
                    return { isValid: false, error: "Question paper data is null or undefined" };
                }

                if (typeof questionPaper !== 'object') {
                    return { isValid: false, error: "Question paper must be an object" };
                }

                if (!questionPaper.content || !Array.isArray(questionPaper.content)) {
                    return { isValid: false, error: "Question paper must have a content array" };
                }

                if (questionPaper.content.length === 0) {
                    return { isValid: false, error: "Content array cannot be empty" };
                }

                // Validate each document in content array
                for (let i = 0; i < questionPaper.content.length; i++) {
                    const document = questionPaper.content[i];
                    
                    if (!document || typeof document !== 'object') {
                        return { isValid: false, error: `Document ${i + 1} is not a valid object` };
                    }

                    // Check headers structure
                    if (!document.headers || !Array.isArray(document.headers)) {
                        return { isValid: false, error: `Document ${i + 1} must have a headers array` };
                    }

                    if (document.headers.length < 8) {
                        return { isValid: false, error: `Document ${i + 1} must have at least 8 header fields` };
                    }

                    // Validate each header has required properties
                    for (let j = 0; j < document.headers.length; j++) {
                        const header = document.headers[j];
                        if (!header || typeof header !== 'object') {
                            return { isValid: false, error: `Document ${i + 1}, header ${j + 1} is not a valid object` };
                        }

                        if (!header.styles || !Array.isArray(header.styles)) {
                            return { isValid: false, error: `Document ${i + 1}, header ${j + 1} must have a styles array` };
                        }
                    }

                    // Check questions structure
                    if (!document.questions || !Array.isArray(document.questions)) {
                        return { isValid: false, error: `Document ${i + 1} must have a questions array` };
                    }

                    // Validate each question
                    for (let k = 0; k < document.questions.length; k++) {
                        const question = document.questions[k];
                        if (!question || typeof question !== 'object') {
                            return { isValid: false, error: `Document ${i + 1}, question ${k + 1} is not a valid object` };
                        }

                        if (typeof question.index === 'undefined') {
                            return { isValid: false, error: `Document ${i + 1}, question ${k + 1} must have an index` };
                        }

                        if (!question.styles || !Array.isArray(question.styles)) {
                            return { isValid: false, error: `Document ${i + 1}, question ${k + 1} must have a styles array` };
                        }

                        if (typeof question.text !== 'string') {
                            return { isValid: false, error: `Document ${i + 1}, question ${k + 1} must have text as string` };
                        }

                        if (typeof question.marks !== 'number') {
                            return { isValid: false, error: `Document ${i + 1}, question ${k + 1} marks must be a number` };
                        }

                        // Validate sub-questions if they exist
                        if (question.options && Array.isArray(question.options)) {
                            for (let l = 0; l < question.options.length; l++) {
                                const subQuestion = question.options[l];
                                if (!subQuestion || typeof subQuestion !== 'object') {
                                    return { isValid: false, error: `Document ${i + 1}, question ${k + 1}, sub-question ${l + 1} is invalid` };
                                }

                                if (!subQuestion.styles || !Array.isArray(subQuestion.styles)) {
                                    return { isValid: false, error: `Document ${i + 1}, question ${k + 1}, sub-question ${l + 1} must have styles array` };
                                }
                            }
                        }
                    }
                }

                return { isValid: true };
            };

            // Automatically apply AI suggestions if provided
            if (data.questionPaperForUser && onApplyChanges) {
                try {
                    let questionPaper;
                    
                    // Parse if it's a string
                    if (typeof data.questionPaperForUser === 'string') {
                        try {
                            questionPaper = JSON.parse(data.questionPaperForUser);
                        } catch (parseError) {
                            console.error('JSON Parse Error:', parseError);
                            throw new Error(`Invalid JSON format: ${parseError.message}`);
                        }
                    } else {
                        questionPaper = data.questionPaperForUser;
                    }

                    // Validate the structure
                    const validation = validateQuestionPaperStructure(questionPaper);
                    
                    if (!validation.isValid) {
                        console.error("Validation failed:", validation.error);
                        const validationErrorMessage = {
                            id: Date.now() + Math.random(),
                            type: 'ai',
                            content: `I generated a response, but the structure was invalid: ${validation.error}. Please try rephrasing your request or ask for something simpler.`,
                            timestamp: new Date()
                        };
                        setMessages(prev => [...prev, validationErrorMessage]);
                        toast.error(`Structure validation failed: ${validation.error}. No changes applied.`);
                        return;
                    }

                    // Apply changes only if validation passes
                    onApplyChanges(questionPaper);
                    toast.success('Question paper updated successfully!');

                } catch (error) {
                    console.error('Failed to process question paper:', error);
                    const processingErrorMessage = {
                        id: Date.now() + Math.random(),
                        type: 'ai',
                        content: `I generated a response, but encountered an error while processing: ${error.message}. Please try a different approach or simpler request.`,
                        timestamp: new Date()
                    };
                    setMessages(prev => [...prev, processingErrorMessage]);
                    toast.error(`Processing failed: ${error.message}. No changes applied.`);
                    return;
                }
            }

            const aiMessage = {
                id: Date.now() + Math.random(), // Ensure unique ID
                type: 'ai',
                content: data.answer || 'I have analyzed your request and updated your question paper.',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);

        } catch (error) {
            console.error('AI Chat Error:', error);
            const errorMessage = {
                id: Date.now() + Math.random(), // Ensure unique ID
                type: 'ai',
                content: 'Sorry, I encountered an error processing your request. Please try again.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
            toast.error('Failed to send message to AI');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex" style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
            {/* Transparent Backdrop - doesn't hide the page */}
            <div
                className="absolute inset-0 transition-opacity"
                onClick={onClose}
            />

            {/* Sidebar */}
            <div className="ai-chat-sidebar relative ml-auto w-full max-w-md h-full bg-gradient-to-b from-zinc-900 to-zinc-800 shadow-2xl flex flex-col" style={{ animation: 'slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                {/* Header */}
                <div className="ai-chat-header flex items-center justify-between p-4 border-b border-zinc-700 bg-zinc-800/80 backdrop-blur">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                            <AIIcon />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">AI Assistant</h2>
                            <p className="text-xs text-zinc-400">Oblivor - Question Paper Expert</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-all ai-button-hover"
                    >
                        <CloseIcon />
                    </button>
                </div>

                {/* Messages */}
                <div className="ai-chat-messages flex-1 overflow-y-auto p-4 space-y-4 chat-messages">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`message-bubble flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-lg ${
                                    message.type === 'user'
                                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white'
                                        : 'bg-zinc-700 text-zinc-100 border border-zinc-600'
                                }`}
                            >
                                {message.context && (
                                    <div className="context-info mb-2 p-2 bg-black bg-opacity-20 rounded-lg">
                                        <div className="flex items-center gap-2 text-xs text-zinc-300">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10"/>
                                                <path d="12 6v6l4 2"/>
                                            </svg>
                                            <span>{message.context}</span>
                                        </div>
                                    </div>
                                )}
                                {message.file && (
                                    <div className="file-preview mb-2 p-2 bg-black bg-opacity-20 rounded-lg">
                                        <div className="flex items-center gap-2 text-xs">
                                            <AttachIcon />
                                            <span>{message.file}</span>
                                        </div>
                                    </div>
                                )}
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                                <div className="message-status text-xs text-zinc-400 mt-2">
                                    {message.timestamp.toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-zinc-700 text-zinc-100 border border-zinc-600 rounded-2xl px-4 py-3 max-w-[80%] shadow-lg">
                                <div className="flex items-center gap-2">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full typing-dot"></div>
                                        <div className="w-2 h-2 bg-blue-500 rounded-full typing-dot"></div>
                                        <div className="w-2 h-2 bg-blue-500 rounded-full typing-dot"></div>
                                    </div>
                                    <span className="text-sm text-zinc-400">Oblivor is thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="ai-chat-input p-4 border-t border-zinc-700 bg-zinc-800/50 backdrop-blur">
                    {attachedFile && (
                        <div className="file-preview mb-3 p-3 bg-zinc-700 rounded-lg border border-zinc-600">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <AttachIcon />
                                    <div>
                                        <p className="text-sm font-medium text-white">{attachedFile.name}</p>
                                        <p className="text-xs text-zinc-400">
                                            {(attachedFile.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={removeAttachedFile}
                                    className="text-zinc-400 hover:text-red-400 transition-colors p-1 rounded"
                                >
                                    <CloseIcon />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex items-end gap-2">
                        <div className="flex-1 relative">
                            <textarea
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask me to improve questions, analyze files, or generate new content..."
                                className="auto-resize focus-ring w-full bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-3 pr-12 text-white placeholder-zinc-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                rows="2"
                                disabled={isLoading}
                            />
                            <input
                                ref={fileInputRef}
                                type="file"
                                onChange={handleFileAttach}
                                className="hidden"
                                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute right-3 bottom-3 text-zinc-400 hover:text-white transition-colors p-1 rounded ai-button-hover"
                                disabled={isLoading}
                            >
                                <AttachIcon />
                            </button>
                        </div>
                        <button
                            onClick={sendMessage}
                            disabled={isLoading || (!inputMessage.trim() && !attachedFile)}
                            className="gradient-purple-blue text-white p-3 rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg ai-button-hover"
                        >
                            <SendIcon />
                        </button>
                    </div>

                    <div className="flex items-center justify-between mt-2 text-xs text-zinc-500">
                        <div className="flex items-center gap-2">
                            <span>Supports: PDF, DOC, DOCX, TXT, images</span>
                            {fullProjectData?.content?.[activeContentIndex] && (
                                <div className="flex items-center gap-1 px-2 py-1 bg-blue-600/20 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"/>
                                        <path d="12 6v6l4 2"/>
                                    </svg>
                                    <span className="text-blue-300">Context: Doc {activeContentIndex + 1}</span>
                                </div>
                            )}
                        </div>
                        <span>Press Enter to send</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIChatSidebar;


