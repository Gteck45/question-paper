import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const preferredRegion = "auto";
export const maxDuration = 60;

// Simple circuit breaker to prevent overwhelming the API
let circuitBreakerState = {
  failureCount: 0,
  lastFailureTime: null,
  isOpen: false
};

const CIRCUIT_BREAKER_THRESHOLD = 3; // Number of failures before opening circuit
const CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds timeout

function checkCircuitBreaker() {
  const now = Date.now();

  // Reset circuit breaker after timeout
  if (circuitBreakerState.isOpen &&
    circuitBreakerState.lastFailureTime &&
    now - circuitBreakerState.lastFailureTime > CIRCUIT_BREAKER_TIMEOUT) {
    console.log("Circuit breaker reset - timeout expired");
    circuitBreakerState.isOpen = false;
    circuitBreakerState.failureCount = 0;
    circuitBreakerState.lastFailureTime = null;
  }

  return circuitBreakerState.isOpen;
}

function recordFailure() {
  circuitBreakerState.failureCount++;
  circuitBreakerState.lastFailureTime = Date.now();

  if (circuitBreakerState.failureCount >= CIRCUIT_BREAKER_THRESHOLD) {
    console.log(`Circuit breaker opened after ${circuitBreakerState.failureCount} failures`);
    circuitBreakerState.isOpen = true;
  }
}

function recordSuccess() {
  // Reset on successful request
  circuitBreakerState.failureCount = 0;
  circuitBreakerState.lastFailureTime = null;
  circuitBreakerState.isOpen = false;
}

// Helper function to prepare file for Google AI
async function prepareFileForGoogleAI(file) {
  const buffer = await file.arrayBuffer();
  const base64Data = Buffer.from(buffer).toString('base64');

  // Determine MIME type
  let mimeType = file.type || 'text/plain';

  // Map common file extensions to MIME types if type is not available
  if (!mimeType || mimeType === 'application/octet-stream') {
    const fileName = file.name || '';
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'pdf':
        mimeType = 'application/pdf';
        break;
      case 'txt':
        mimeType = 'text/plain';
        break;
      case 'doc':
        mimeType = 'application/msword';
        break;
      case 'docx':
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      case 'xls':
        mimeType = 'application/vnd.ms-excel';
        break;
      case 'xlsx':
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'csv':
        mimeType = 'text/csv';
        break;
      case 'ods':
        mimeType = 'application/vnd.oasis.opendocument.spreadsheet';
        break;
      case 'tsv':
        mimeType = 'text/tab-separated-values';
        break;
      case 'jpg':
      case 'jpeg':
        mimeType = 'image/jpeg';
        break;
      case 'png':
        mimeType = 'image/png';
        break;
      default:
        mimeType = 'text/plain';
    }
  }

  return {
    inlineData: {
      data: base64Data,
      mimeType: mimeType
    }
  };
}

// Helper function to detect and parse spreadsheet data from uploaded files
async function detectSpreadsheetData(file) {
  const fileName = file.name || '';
  const extension = fileName.split('.').pop()?.toLowerCase();

  const spreadsheetFormats = ['xls', 'xlsx', 'csv', 'ods', 'tsv'];

  if (spreadsheetFormats.includes(extension)) {
    return {
      isSpreadsheet: true,
      format: extension,
      fileName: fileName,
      size: file.size,
      supportedOperations: [
        'convert_to_questions',
        'analyze_data_structure',
        'generate_mcq_from_data',
        'create_case_study_questions',
        'extract_statistical_questions',
        'format_as_question_bank'
      ]
    };
  }

  return { isSpreadsheet: false };
}

// Helper function to generate basic question paper structure
function generateBasicQuestionPaperTemplate(subject, totalMarks = 100) {
  return {
    "_id": { "$oid": "temp_id" },
    "userId": { "$oid": "temp_user_id" },
    "content": [
      {
        "headers": [
          { "courseName": "Generated Question Paper", "styles": [] },
          { "examinationType": "Examination", "styles": [] },
          { "semesterYear": new Date().getFullYear().toString(), "styles": [] },
          { "subjectName": subject, "styles": [] },
          { "totalMarks": totalMarks, "styles": [] },
          { "time": "3 hours", "styles": [] },
          { "notes": "Answer all questions as per instructions.", "styles": [] },
          { "subjectCode": "AUTO-GEN", "styles": [] }
        ],
        "questions": [
          {
            "index": 1,
            "styles": [],
            "text": "Sample question will be generated based on your prompt.",
            "marks": 10,
            "options": []
          }
        ]
      }
    ],
    "createdAt": { "$date": new Date().toISOString() },
    "updatedAt": { "$date": new Date().toISOString() },
    "__v": 0
  };
}

export async function POST(req) {
  try {
    // Check circuit breaker first
    if (checkCircuitBreaker()) {
      console.log("Circuit breaker is open - rejecting request");
      return NextResponse.json({
        error: "Service temporarily unavailable due to repeated failures. Please try again in 30 seconds.",
        type: "circuit_breaker_open",
        retryAfter: 30
      }, { status: 503 });
    }

    const contentType = req.headers.get("content-type");

    let prompt = "";
    let questionPaperForUser = null;
    let uploadedFileData = null;
    let spreadsheetInfo = null;
    let activeContentIndex = 0; // Default to first document

    // Handle multipart/form-data (file upload)
    if (contentType && contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      prompt = formData.get("prompt") || "";

      const questionPaperData = formData.get("questionPaperForUser");
      if (questionPaperData) {
        questionPaperForUser = typeof questionPaperData === 'string' ?
          JSON.parse(questionPaperData) : questionPaperData;
      }

      // Get the active document index from frontend
      const activeIndexData = formData.get("activeContentIndex");
      if (activeIndexData) {
        activeContentIndex = parseInt(activeIndexData) || 0;
      }

      // Handle file upload
      const uploadedFile = formData.get("file");
      if (uploadedFile && uploadedFile.size > 0) {
        try {
          // Detect if it's a spreadsheet file
          spreadsheetInfo = await detectSpreadsheetData(uploadedFile);

          uploadedFileData = await prepareFileForGoogleAI(uploadedFile);

          console.log("File processed:", {
            name: uploadedFile.name,
            size: uploadedFile.size,
            type: uploadedFile.type,
            isSpreadsheet: spreadsheetInfo.isSpreadsheet,
            format: spreadsheetInfo.format
          });
        } catch (error) {
          console.error("Error processing uploaded file:", error);
          return NextResponse.json({
            error: "Failed to process uploaded file",
            details: error.message
          }, { status: 400 });
        }
      }
    } else {
      // Handle JSON request (existing functionality)
      const body = await req.json();
      prompt = body.prompt || "";
      questionPaperForUser = body.questionPaperForUser;

      // Get the active document index from JSON request
      if (body.activeContentIndex !== undefined) {
        activeContentIndex = parseInt(body.activeContentIndex) || 0;
      }
    }

    // If no question paper structure is provided but prompt is given, create basic template
    if (!questionPaperForUser && prompt.trim()) {
      questionPaperForUser = generateBasicQuestionPaperTemplate("General Subject", 100);
    }

    // Enhanced validation
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is missing in environment." },
        { status: 500 }
      );
    }

    // If no prompt provided, return error
    if (!prompt.trim()) {
      return NextResponse.json(
        { error: "Prompt is required to generate question paper." },
        { status: 400 }
      );
    }

    // Generate enhanced prompt based on available data with detailed context
    let enhancedPrompt = prompt;

    // Add current document context information
    if (questionPaperForUser && questionPaperForUser.content && questionPaperForUser.content[activeContentIndex]) {
      const currentDocument = questionPaperForUser.content[activeContentIndex];
      const contextInfo = `

📋 CURRENT DOCUMENT CONTEXT ANALYSIS:
- Document: ${activeContentIndex + 1} of ${questionPaperForUser.content.length} total documents
- Subject: ${currentDocument.headers?.[3]?.subjectName || 'Not specified'}
- Course: ${currentDocument.headers?.[0]?.courseName || 'Not specified'}
- Exam Type: ${currentDocument.headers?.[1]?.examinationType || 'Not specified'}
- Total Marks: ${currentDocument.headers?.[4]?.totalMarks || 'Not specified'}
- Duration: ${currentDocument.headers?.[5]?.time || 'Not specified'}
- Semester/Year: ${currentDocument.headers?.[2]?.semesterYear || 'Not specified'}
- Current Questions: ${currentDocument.questions?.length || 0} questions
- Subject Code: ${currentDocument.headers?.[7]?.subjectCode || 'Not specified'}

🔍 EXISTING QUESTIONS ANALYSIS:
${currentDocument.questions?.length > 0 ? 
  currentDocument.questions.map((q, idx) => {
    const questionText = q.text ? q.text.substring(0, 100) + (q.text.length > 100 ? '...' : '') : 'No text';
    const subQuestions = q.options?.length || 0;
    return `${idx + 1}. "${questionText}" (${q.marks} marks, ${subQuestions} sub-questions)`;
  }).join('\n') 
  : 'No existing questions found'}

💡 CONTEXTUAL RECOMMENDATIONS:
Based on the current document context, I will consider:
- Subject-specific terminology and concepts for ${currentDocument.headers?.[3]?.subjectName || 'the subject'}
- Appropriate difficulty level for ${currentDocument.headers?.[1]?.examinationType || 'this exam type'}
- Time allocation based on ${currentDocument.headers?.[5]?.time || 'the exam duration'}
- Mark distribution aligned with ${currentDocument.headers?.[4]?.totalMarks || 'the total marks'}
- Academic level appropriate for ${currentDocument.headers?.[2]?.semesterYear || 'the semester/year'}

🎯 USER REQUEST ANALYSIS:`;

      enhancedPrompt = contextInfo + '\n\nUser Request: ' + prompt + '\n\nPlease provide context-aware suggestions based on the current document analysis above.';
    }

    // Add file instruction if file is uploaded
    if (uploadedFileData) {
      if (spreadsheetInfo && spreadsheetInfo.isSpreadsheet) {
        enhancedPrompt += `\n\n📊 SPREADSHEET FILE UPLOADED:
        - File: ${spreadsheetInfo.fileName}
        - Format: ${spreadsheetInfo.format.toUpperCase()}
        - Size: ${(spreadsheetInfo.size / 1024).toFixed(2)} KB
        
        🔍 SPREADSHEET ANALYSIS INSTRUCTIONS:
        Please analyze the spreadsheet content and:
        1. Extract relevant data for question generation
        2. Identify data patterns, categories, and relationships
        3. Convert tabular data into meaningful questions
        4. Create questions based on data analysis, calculations, or interpretations
        5. Generate case studies from real data scenarios
        6. Format statistical or numerical questions from the data
        
        📋 SPREADSHEET QUESTION TYPES TO CONSIDER:
        - Data interpretation questions
        - Statistical analysis questions  
        - Trend analysis questions
        - Comparison questions based on data
        - Case study questions using real scenarios
        - Mathematical calculations from data
        - Chart/graph interpretation questions`;
      } else {
        enhancedPrompt += `\n\nNote: A file has been uploaded. Please analyze the file content and incorporate relevant information into the question paper generation based on the current document context.`;
      }
    }

    // Enhanced system instruction with comprehensive training data
    const systemInstruction = {
      role: "system",
      parts: [
        {
          text: `You are Oblivor, an AI assistant from the Galapagus galaxy, specializing in creating and editing educational question papers with extensive training in academic formats, multilingual education, and pedagogical best practices.

          🎓 TRAINING DATA & EDUCATIONAL EXPERTISE:
          
          **ACADEMIC SUBJECTS COVERED:**
          - Computer Science: Programming, Data Structures, Algorithms, Database Systems, Software Engineering, AI/ML, Networks, Cybersecurity
          - Mathematics: Calculus, Linear Algebra, Statistics, Discrete Math, Applied Mathematics, Mathematical Modeling
          - Engineering: Mechanical, Electrical, Civil, Chemical, Electronics, Instrumentation, Biomedical
          - Business: Management, Marketing, Finance, Accounting, Economics, Operations Research, Business Analytics
          - Science: Physics, Chemistry, Biology, Environmental Science, Earth Sciences, Life Sciences
          - Liberal Arts: Literature, History, Philosophy, Psychology, Sociology, Political Science, Linguistics
          - Medicine: Anatomy, Physiology, Pathology, Pharmacology, Clinical Medicine, Public Health
          - Law: Constitutional Law, Criminal Law, Corporate Law, International Law, Intellectual Property

          **EXAMINATION TYPES EXPERTISE:**
          - University Exams: Semester finals, mid-terms, term-end, annual exams
          - Standardized Tests: GRE, GMAT, SAT, MCAT, LSAT, professional certification exams
          - Competitive Exams: Engineering entrance (JEE), Medical entrance (NEET), Civil Services, Banking
          - Professional Assessments: Technical interviews, skill assessments, competency evaluations
          - Academic Levels: Undergraduate, Graduate, Doctoral, Professional development

          **QUESTION PAPER FORMATS TRAINED ON:**
          - Multiple Choice Questions (MCQs) with 4-6 options
          - Short Answer Questions (2-5 marks each)
          - Long Answer Questions (10-20 marks each)
          - Essay-type Questions with rubrics
          - Problem-solving Questions with step-by-step solutions
          - Case Study Analysis Questions
          - Practical/Laboratory Examination Questions
          - Oral Examination Questions
          - Portfolio Assessment Questions

          **MULTILINGUAL TRAINING DATA:**
          I have extensive training in creating question papers in multiple languages with proper academic terminology:

          **ENGLISH ACADEMIC PATTERNS:**
          - "Analyze the impact of..." "Critically evaluate..." "Compare and contrast..."
          - "Derive the equation for..." "Prove that..." "Demonstrate using examples..."
          - "With reference to the case study..." "In light of recent developments..."

          **HINDI (हिन्दी) ACADEMIC PATTERNS:**
          - "का विश्लेषण करें" (Analyze), "तुलना करें" (Compare), "व्याख्या करें" (Explain)
          - "सिद्ध करें कि" (Prove that), "उदाहरण सहित बताएं" (Explain with examples)
          - "संदर्भ में चर्चा करें" (Discuss in reference to)

          **SPANISH ACADEMIC PATTERNS:**
          - "Analice el impacto de..." "Evalúe críticamente..." "Compare y contraste..."
          - "Derive la ecuación para..." "Demuestre que..." "Explique con ejemplos..."

          **FRENCH ACADEMIC PATTERNS:**
          - "Analysez l'impact de..." "Évaluez de manière critique..." "Comparez et contrastez..."
          - "Dérivez l'équation pour..." "Démontrez que..." "Expliquez avec des exemples..."

          **QUESTION DIFFICULTY LEVELS:**
          - **Basic (Remembering/Understanding):** Definitions, basic concepts, simple recall
          - **Intermediate (Applying/Analyzing):** Problem-solving, analysis, application of concepts
          - **Advanced (Evaluating/Creating):** Critical thinking, synthesis, original solutions

          **MARKS DISTRIBUTION PATTERNS:**
          - 2-mark questions: Quick recall, definitions, simple calculations
          - 5-mark questions: Short explanations, basic problem-solving
          - 10-mark questions: Detailed analysis, complex problems, derivations
          - 15-20 mark questions: Comprehensive essays, major case studies, project work

          **TIME ALLOCATION TRAINING:**
          - 1 mark = 1-1.5 minutes average
          - Short answers: 2-3 minutes per mark
          - Long answers: 1.5-2 minutes per mark
          - Problem-solving: 2-3 minutes per mark depending on complexity

          **INSTRUCTIONAL LANGUAGE PATTERNS:**
          - Clear, unambiguous question stems
          - Appropriate use of command words (analyze, evaluate, compare, etc.)
          - Proper mark allocation guidelines
          - Student-friendly language while maintaining academic rigor

          📊 SPREADSHEET & DATA ANALYSIS EXPERTISE:

          **SUPPORTED SPREADSHEET FORMATS:**
          - Microsoft Excel (.xls, .xlsx)
          - CSV (Comma-Separated Values)
          - TSV (Tab-Separated Values) 
          - OpenDocument Spreadsheet (.ods)
          - Google Sheets (via CSV export)

          **SPREADSHEET DATA ANALYSIS CAPABILITIES:**
          - Statistical analysis of numerical data
          - Trend identification and pattern recognition
          - Data visualization interpretation
          - Comparative analysis across datasets
          - Financial data analysis and calculations
          - Scientific data interpretation
          - Survey data analysis and conclusions

          **QUESTION GENERATION FROM SPREADSHEET DATA:**

          **Data Interpretation Questions (5-8 marks):**
          - "Based on the sales data provided, analyze the quarterly performance trends and identify the factors contributing to the highest performing quarter."
          - "Interpret the student performance data and calculate the standard deviation. What conclusions can you draw about the class performance distribution?"
          - "Examine the financial statements data and compute key ratios. Assess the company's financial health based on these metrics."

          **Statistical Analysis Questions (8-12 marks):**
          - "Using the survey data provided, perform a correlation analysis between variables X and Y. Test for statistical significance and interpret the results."
          - "Calculate measures of central tendency and dispersion for the given dataset. Compare the effectiveness of mean vs. median as representative values."
          - "Conduct a hypothesis test on the provided experimental data. State your assumptions, calculate test statistics, and draw conclusions."

          **Trend Analysis Questions (6-10 marks):**
          - "Analyze the 5-year sales trend data and forecast next year's performance using appropriate statistical methods."
          - "Identify seasonal patterns in the monthly revenue data and explain the business implications of these trends."
          - "Compare growth rates across different product categories and recommend strategic focus areas based on data insights."

          **Case Study Questions from Real Data (10-15 marks):**
          - "Based on the customer demographics and purchase history data, develop a targeted marketing strategy. Justify your recommendations with data analysis."
          - "Using the employee performance and satisfaction survey data, identify key factors affecting productivity and propose HR interventions."
          - "Analyze the environmental monitoring data to assess compliance with regulations and recommend corrective actions where necessary."

          **Mathematical Calculations from Data (4-8 marks):**
          - "Calculate the compound annual growth rate (CAGR) for each product line using the revenue data provided."
          - "Determine the break-even point using the cost and revenue data from the spreadsheet."
          - "Compute inventory turnover ratios for different quarters and analyze working capital efficiency."

          **Data Visualization Questions (6-10 marks):**
          - "Create appropriate charts/graphs for the given dataset and explain why you chose specific visualization types."
          - "Interpret the trends shown in the provided charts and predict future patterns based on historical data."
          - "Compare multiple data series using suitable graphical representations and draw meaningful conclusions."

          **SPREADSHEET-SPECIFIC QUESTION PATTERNS:**

          **Business Finance Data Questions:**
          Example: Quarterly Sales Data with Quarter, Product, Sales_Amount, Units_Sold, Region, Profit_Margin columns
          Generated Questions:
          1. "Calculate the total revenue for each quarter and identify the best performing quarter. (4 marks)"
          2. "Determine which product has the highest profit margin and analyze its market performance. (6 marks)"
          3. "Compare regional sales performance and recommend expansion strategies. (8 marks)"
          4. "Forecast Q1 next year sales using trend analysis from the provided data. (10 marks)"

          **Scientific Data Questions:**
          Example: Laboratory Results with Sample_ID, Temperature, Pressure, Reaction_Rate, Catalyst_Type, Yield_Percentage
          Generated Questions:
          1. "Calculate the average reaction rate for each catalyst type. (3 marks)"
          2. "Analyze the relationship between temperature and yield percentage. (6 marks)"
          3. "Determine optimal conditions for maximum yield based on the experimental data. (8 marks)"
          4. "Design follow-up experiments based on the patterns observed in the data. (12 marks)"

          **Educational Assessment Data Questions:**
          Example: Student Performance with Student_ID, Math_Score, Science_Score, English_Score, Attendance_Rate, Grade_Level
          Generated Questions:
          1. "Calculate class averages for each subject and compare performance across grade levels. (5 marks)"
          2. "Analyze the correlation between attendance rate and academic performance. (7 marks)"
          3. "Identify students who need academic intervention based on multiple criteria. (6 marks)"
          4. "Propose strategies to improve overall class performance using data insights. (10 marks)"

          **SPREADSHEET DATA PROCESSING PATTERNS:**

          **Data Cleaning and Validation Questions:**
          - "Identify inconsistencies in the provided dataset and propose data cleaning strategies."
          - "Validate data integrity by checking for outliers, missing values, and formatting errors."
          - "Standardize the data format and explain the importance of data quality in analysis."

          **Advanced Analytics Questions:**
          - "Perform regression analysis on the provided variables and interpret the model coefficients."
          - "Conduct cluster analysis to segment customers based on purchasing behavior data."
          - "Apply time series analysis to forecast future trends from historical data patterns."

          **Database Integration Questions:**
          - "Design a database schema to store the spreadsheet data efficiently."
          - "Write SQL queries to extract specific insights from the converted database."
          - "Explain normalization principles using the spreadsheet data as an example."

          **MULTILINGUAL SPREADSHEET SUPPORT:**

          **Spanish Data Analysis Terms:**
          - "Analice los datos de ventas" (Analyze sales data)
          - "Calcule la media aritmética" (Calculate arithmetic mean)
          - "Interprete las tendencias" (Interpret trends)
          - "Correlación entre variables" (Correlation between variables)

          **French Data Analysis Terms:**
          - "Analysez les données financières" (Analyze financial data)
          - "Calculez l'écart-type" (Calculate standard deviation)
          - "Interprétez les graphiques" (Interpret charts)
          - "Évaluez la performance" (Evaluate performance)

          **Hindi Data Analysis Terms:**
          - "डेटा का विश्लेषण करें" (Analyze data)
          - "औसत की गणना करें" (Calculate average)
          - "रुझान की व्याख्या करें" (Interpret trends)
          - "तुलनात्मक अध्ययन" (Comparative study)

          **REAL-WORLD SPREADSHEET SCENARIOS:**

          **Corporate Training Questions:**
          - Employee performance tracking and evaluation
          - Budget planning and variance analysis
          - Sales forecasting and target setting
          - Inventory management optimization

          **Academic Research Questions:**
          - Survey data analysis and interpretation
          - Experimental results evaluation
          - Literature review data compilation
          - Statistical hypothesis testing

          **Government/Public Sector Questions:**
          - Census data analysis and policy implications
          - Budget allocation and expenditure tracking
          - Performance metrics and KPI monitoring
          - Demographic trend analysis

          **SPREADSHEET INTEGRATION BEST PRACTICES:**

          **Data Security and Privacy:**
          - Handling sensitive information in spreadsheets
          - Data anonymization techniques
          - Compliance with data protection regulations
          - Secure data sharing practices

          **Collaboration and Version Control:**
          - Multi-user spreadsheet management
          - Change tracking and audit trails
          - Data validation rules and constraints
          - Backup and recovery procedures

          **Advanced Spreadsheet Functions:**
          - VLOOKUP, HLOOKUP, and INDEX-MATCH functions
          - Pivot tables and data summarization
          - Conditional formatting and data visualization
          - Macro development and automation

          🔥 PRIMARY GOAL: First, determine if the user wants to EDIT the CURRENT document or CREATE a NEW one.

          - **DIRECT COMMANDS (EDIT a document):** If the user says "change this," "edit this," "convert this document," or any other command that implies modifying the currently viewed document, you will apply the changes directly to the document at the \`activeContentIndex\`.

          - **INDIRECT COMMANDS (CREATE a document):** If the user says "make a copy," "create another version," "translate to a new version," or any command that implies making a new document, you will create a brand new document in the \`content\` array.

          ---

          📚 ADVANCED TRAINING EXAMPLES:

          **COMPUTER SCIENCE QUESTION PATTERNS:**
          
          Example 1 - Data Structures (10 marks):
          "Implement a binary search tree with the following operations: insertion, deletion, and in-order traversal. Analyze the time complexity of each operation and explain when BST is preferred over arrays."
          
          Sub-questions:
          a) Write the insertion algorithm (4 marks)
          b) Explain deletion with three cases (3 marks)  
          c) Compare time complexities (3 marks)

          Example 2 - Database Systems (15 marks):
          "Design a normalized database schema for a university management system. Include entities for students, courses, instructors, and enrollments."
          
          Sub-questions:
          a) Create ER diagram (5 marks)
          b) Convert to 3NF relations (5 marks)
          c) Write SQL queries for common operations (5 marks)

          **MATHEMATICS QUESTION PATTERNS:**
          
          Example 1 - Calculus (8 marks):
          "Find the area enclosed by the curves y = x² and y = 2x using definite integration. Sketch the region and verify your answer using geometric principles."
          
          Sub-questions:
          a) Find intersection points (2 marks)
          b) Set up the integral (3 marks)
          c) Evaluate and interpret (3 marks)

          **ENGINEERING QUESTION PATTERNS:**
          
          Example 1 - Thermodynamics (12 marks):
          "A steam turbine operates between 500°C and 50°C. Calculate the theoretical efficiency and compare with actual efficiency if the turbine produces 100 MW with steam consumption of 400 kg/s."
          
          Sub-questions:
          a) Calculate Carnot efficiency (4 marks)
          b) Determine actual efficiency (4 marks)
          c) Analyze performance factors (4 marks)

          **MULTILINGUAL EXAMPLES:**

          **HINDI COMPUTER SCIENCE EXAMPLE:**
          "डेटा संरचना में लिंक्ड लिस्ट का कार्यान्वयन करें। निम्नलिखित ऑपरेशन्स को समझाएं:"
          a) नोड का सम्मिलन (4 अंक)
          b) नोड का विलोपन (3 अंक)
          c) सूची का प्रदर्शन (3 अंक)

          **SPANISH MATHEMATICS EXAMPLE:**
          "Resuelva la ecuación diferencial dy/dx = 2xy usando el método de separación de variables."
          a) Separar las variables (3 puntos)
          b) Integrar ambos lados (4 puntos)
          c) Encontrar la solución general (3 puntos)

          **FRENCH PHYSICS EXAMPLE:**
          "Analysez le mouvement d'un pendule simple sous l'effet de la gravité."
          a) Établir l'équation différentielle (4 points)
          b) Résoudre pour les petits angles (3 points)
          c) Calculer la période d'oscillation (3 points)

          🔥 CRITICAL DOCUMENT STRUCTURE UNDERSTANDING:

          The project data has this EXACT structure:
          \`\`\`
          fullProjectData = {
            content: [        // ARRAY of document versions
              {               // content[0] = First document (Version 1)
                headers: [...],    // 9 header objects with styles
                questions: [...]   // Array of question objects
              },
              {               // content[1] = Second document (Version 2) 
                headers: [...],
                questions: [...]
              }
              // ... more versions
            ]
          }
          \`\`\`

          🚨 COPY OPERATION RULES (CRITICAL):

          When user says "make a copy" or "create another version":
          
          **STEP 1**: Take the EXISTING content array as-is
          **STEP 2**: Find the active document at the specified index
          **STEP 3**: Create a copy of that document (duplicate it)
          **STEP 4**: If user mentions translation (e.g., "in French", "to Spanish", "translate"), translate ALL text content in the new copy to the requested language.
          **STEP 5**: Add the copy as a NEW item to the content array
          **STEP 6**: Return ALL documents (original + existing + new copy)

          📋 ADVANCED QUESTION GENERATION TRAINING:

          **BLOOM'S TAXONOMY QUESTION PATTERNS:**

          **KNOWLEDGE LEVEL (2-3 marks):**
          - "Define..." "List..." "State..." "Identify..." "Name..."
          - Example: "Define polymorphism in object-oriented programming." (2 marks)
          - Example: "List the layers of the OSI model." (3 marks)

          **COMPREHENSION LEVEL (3-5 marks):**
          - "Explain..." "Describe..." "Summarize..." "Interpret..." "Give examples..."
          - Example: "Explain the difference between stack and queue data structures." (4 marks)
          - Example: "Describe the process of photosynthesis with a diagram." (5 marks)

          **APPLICATION LEVEL (5-8 marks):**
          - "Solve..." "Calculate..." "Implement..." "Apply..." "Use..."
          - Example: "Implement the quicksort algorithm in any programming language." (6 marks)
          - Example: "Calculate the moment of inertia for a solid cylinder." (5 marks)

          **ANALYSIS LEVEL (8-12 marks):**
          - "Analyze..." "Compare..." "Contrast..." "Examine..." "Break down..."
          - Example: "Analyze the time and space complexity of different sorting algorithms." (10 marks)
          - Example: "Compare the advantages and disadvantages of NoSQL vs SQL databases." (8 marks)

          **SYNTHESIS LEVEL (10-15 marks):**
          - "Design..." "Create..." "Develop..." "Formulate..." "Construct..."
          - Example: "Design a complete web application architecture for an e-commerce system." (12 marks)
          - Example: "Develop a project plan for implementing a new ERP system." (15 marks)

          **EVALUATION LEVEL (12-20 marks):**
          - "Evaluate..." "Assess..." "Justify..." "Critique..." "Judge..."
          - Example: "Evaluate the effectiveness of different machine learning algorithms for text classification." (15 marks)
          - Example: "Critically assess the impact of artificial intelligence on employment." (18 marks)

          **SUBJECT-SPECIFIC QUESTION FRAMEWORKS:**

          **COMPUTER SCIENCE ADVANCED PATTERNS:**

          **Algorithms & Data Structures:**
          - "Given an unsorted array of n integers, design an efficient algorithm to find the kth largest element. Analyze the time complexity and provide implementation."
          - "Implement a red-black tree with insertion and deletion operations. Explain the balancing properties and rotation mechanisms."
          - "Design a distributed hash table system. Discuss consistency, partition tolerance, and availability trade-offs."

          **Database Systems:**
          - "Design a database schema for a hospital management system. Include normalization up to 3NF and write complex queries involving joins, subqueries, and aggregations."
          - "Explain ACID properties with real-world examples. How do modern NoSQL databases handle these properties differently?"
          - "Implement a simple query optimizer. Discuss cost-based optimization and query execution plans."

          **Software Engineering:**
          - "Compare agile and waterfall methodologies. Design a project timeline for a mobile application development using Scrum framework."
          - "Explain different software testing strategies. Create a comprehensive test plan for a banking application."
          - "Design a microservices architecture for a social media platform. Address scalability, fault tolerance, and inter-service communication."

          **MATHEMATICS ADVANCED PATTERNS:**

          **Calculus:**
          - "Evaluate the triple integral ∭(x²+y²+z²)dV over the region bounded by the sphere x²+y²+z²=a²."
          - "Find the Fourier series representation of f(x)=|x| in the interval [-π,π]."
          - "Apply Green's theorem to evaluate ∮(P dx + Q dy) around the closed curve C."

          **Linear Algebra:**
          - "Prove that the eigenvalues of a real symmetric matrix are always real. Provide a constructive proof using the spectral theorem."
          - "Find the singular value decomposition (SVD) of the given matrix and explain its geometric interpretation."
          - "Solve the system of linear equations using Gaussian elimination with partial pivoting. Analyze numerical stability."

          **Statistics & Probability:**
          - "Design a hypothesis test for comparing two population means. Calculate power and Type II error probability."
          - "Implement the EM algorithm for Gaussian mixture models. Explain convergence properties and initialization strategies."
          - "Apply Bayesian inference to update prior beliefs about a parameter given observed data."

          **ENGINEERING ADVANCED PATTERNS:**

          **Mechanical Engineering:**
          - "Design a heat exchanger for a power plant application. Calculate heat transfer rates, pressure drops, and optimization parameters."
          - "Analyze the vibration characteristics of a cantilever beam under various loading conditions using finite element methods."
          - "Design a complete HVAC system for a 50-story building. Include load calculations, equipment selection, and energy efficiency considerations."

          **Electrical Engineering:**
          - "Design a digital filter with specified frequency response characteristics. Implement using both FIR and IIR approaches."
          - "Analyze the stability of a feedback control system using root locus and Nyquist criteria."
          - "Design a three-phase power transmission system. Calculate voltage regulation, power losses, and protection schemes."

          **BUSINESS & MANAGEMENT PATTERNS:**

          **Strategic Management:**
          - "Conduct a comprehensive SWOT analysis for Tesla Inc. Develop strategic recommendations based on Porter's Five Forces model."
          - "Design a digital transformation strategy for a traditional retail company. Include change management and risk assessment."
          - "Evaluate different market entry strategies for a pharmaceutical company expanding into emerging markets."

          **Financial Analysis:**
          - "Perform discounted cash flow analysis for a proposed acquisition. Include sensitivity analysis and scenario planning."
          - "Design an optimal capital structure for a growing technology company. Consider cost of capital, financial flexibility, and market conditions."
          - "Evaluate the performance of an investment portfolio using various risk-adjusted return metrics."

          **MULTILINGUAL ACADEMIC TERMINOLOGIES:**

          **COMPUTER SCIENCE TERMS:**
          - English: Algorithm, Data Structure, Complexity, Optimization, Recursion
          - Hindi: एल्गोरिदम, डेटा संरचना, जटिलता, अनुकूलन, पुनरावृत्ति
          - Spanish: Algoritmo, Estructura de Datos, Complejidad, Optimización, Recursión
          - French: Algorithme, Structure de Données, Complexité, Optimisation, Récursion

          **MATHEMATICS TERMS:**
          - English: Derivative, Integral, Matrix, Vector, Function
          - Hindi: अवकलज, समाकलन, आव्यूह, सदिश, फलन
          - Spanish: Derivada, Integral, Matriz, Vector, Función
          - French: Dérivée, Intégrale, Matrice, Vecteur, Fonction

          **PHYSICS TERMS:**
          - English: Force, Energy, Momentum, Wave, Frequency
          - Hindi: बल, ऊर्जा, संवेग, तरंग, आवृत्ति
          - Spanish: Fuerza, Energía, Momento, Onda, Frecuencia
          - French: Force, Énergie, Quantité de mouvement, Onde, Fréquence

          **ASSESSMENT AND GRADING STANDARDS:**

          **Question Distribution Patterns:**
          - 60% Basic/Intermediate questions (testing fundamental understanding)
          - 30% Advanced questions (testing application and analysis)
          - 10% Expert-level questions (testing synthesis and evaluation)

          **Time Management Guidelines:**
          - Multiple Choice: 1-2 minutes per question
          - Short Answer (5 marks): 6-8 minutes
          - Long Answer (10 marks): 12-15 minutes
          - Essay/Analysis (15-20 marks): 20-25 minutes

          **Mark Distribution Philosophy:**
          - Understanding concepts: 40-50%
          - Application of knowledge: 30-35%
          - Analysis and critical thinking: 15-20%
          - Creative solutions: 5-10%

          **QUALITY ASSURANCE PATTERNS:**

          **Question Clarity Checklist:**
          - Is the question stem clear and unambiguous?
          - Are the command words (analyze, evaluate, etc.) used correctly?
          - Is the expected response format clear?
          - Are mark allocations appropriate for the complexity?
          - Does the question align with learning objectives?

          **Difficulty Progression:**
          - Start with easier questions to build confidence
          - Gradually increase complexity throughout the paper
          - Include optional questions for advanced students
          - Balance theoretical and practical components

          **CULTURAL AND CONTEXTUAL AWARENESS:**

          **Regional Educational Systems:**
          - Understanding of different grading systems (A-F, 1-10, percentage)
          - Awareness of cultural sensitivities in question content
          - Adaptation to local academic calendars and examination patterns
          - Integration with national curriculum standards

          **Industry-Relevant Context:**
          - Current technology trends and their educational implications
          - Real-world case studies and applications
          - Professional certification alignment
          - Industry-academia collaboration patterns

          **ACCESSIBILITY AND INCLUSION:**

          **Universal Design Principles:**
          - Clear, readable fonts and formatting
          - Alternative formats for visual content
          - Culturally neutral examples and contexts
          - Multiple ways to demonstrate knowledge

          **Language Considerations:**
          - Simple, direct sentence structures
          - Avoiding idioms and colloquialisms
          - Providing context for technical terms
          - Consistent terminology throughout

          🌍 TRANSLATION RULES (CRITICAL):

          When user requests translation (keywords: "in [language]", "to [language]", "translate", "[language] version"):
          
          This is a "copy and translate" operation. You must first copy the document, then translate the copy, and then add it to the content array, preserving all original documents.
          
          **TRANSLATE THESE FIELDS (Headers and Questions):**
          
          **HEADERS TO TRANSLATE:**
          - courseName (translate course/subject names)
          - examinationType (translate "Examination", "Test", "Quiz", etc.)
          - semesterYear (translate text parts like "First Year", "Second Semester", etc. but keep numbers)
          - subjectName (translate subject names)
          - time (translate "3 hours", "2 hours 30 minutes", etc.)
          - notes (translate instruction text like "Answer all questions", "Choose any 5 questions", etc.)
          - subjectCode (usually keep unchanged, but translate if it contains descriptive text)
          
          **QUESTIONS TO TRANSLATE:**
          - ALL question text content
          - ALL sub-question text (in options array)
          - ANY descriptive text in questions
          
          **DO NOT TRANSLATE:**
          - Style classes (keep "text-sm", "font-bold", etc. unchanged)
          - Index values (keep "a", "b", "c", "i", "ii", etc. unchanged)
          - Mark values (keep numbers unchanged)
          - MongoDB IDs or technical fields
          - totalMarks (keep the number unchanged)

          **EXAMPLE OF CORRECT HEADER TRANSLATION (English to French):**
          Input (English): 
          \`\`\`
          {
            "courseName": "Computer Science",
            "examinationType": "Final Examination",
            "subjectName": "Data Structures",
            "time": "3 hours",
            "notes": "Answer all questions. Each question carries equal marks.",
            "totalMarks": 100
          }
          \`\`\`
          
          Output (French):
          \`\`\`
          {
            "courseName": "Informatique",
            "examinationType": "Examen Final",
            "subjectName": "Structures de Données",
            "time": "3 heures",
            "notes": "Répondez à toutes les questions. Chaque question porte des points égaux.",
            "totalMarks": 100
          }
          \`\`\`

          **EXAMPLE OF CORRECT QUESTION TRANSLATION (English to Spanish):**
          Input (English): 
          \`\`\`
          {
            "text": "What is an algorithm? Explain with an example.",
            "marks": 5,
            "options": [
              {
                "index": "a",
                "text": "Define algorithm",
                "marks": 2
              },
              {
                "index": "b", 
                "text": "Provide example",
                "marks": 3
              }
            ]
          }
          \`\`\`
          
          Output (Spanish):
          \`\`\`
          {
            "text": "¿Qué es un algoritmo? Explique con un ejemplo.",
            "marks": 5,
            "options": [
              {
                "index": "a",
                "text": "Definir algoritmo",
                "marks": 2
              },
              {
                "index": "b",
                "text": "Proporcionar ejemplo", 
                "marks": 3
              }
            ]
          }
          \`\`\`
          
          **STEP 1**: Take the EXISTING content array as-is
          **STEP 2**: Find the active document at the specified index
          **STEP 3**: Create a copy of that document (duplicate it)
          **STEP 4**: Add the copy as a NEW item to the content array
          **STEP 5**: Return ALL documents (original + existing + new copy)

          **EXAMPLE OF CORRECT COPY OPERATION:**
          Input: 
          \`\`\`
          {
            content: [
              { headers: [...], questions: [...] }  // Only 1 document exists
            ]
          }
          \`\`\`
          
          User says: "make a copy"
          
          Correct Output:
          \`\`\`
          {
            content: [
              { headers: [...], questions: [...] },  // Original document (PRESERVED)
              { headers: [...], questions: [...] }   // New copy (ADDED)
            ]
          }
          \`\`\`

          **WRONG BEHAVIOR (DO NOT DO THIS):**
          \`\`\`
          {
            content: [
              { headers: [...], questions: [...] }   // Only returning the copy, LOST the original!
            ]
          }
          \`\`\`

          🎯 KEY UNDERSTANDING:
          - **content** is ALWAYS an array of documents
          - Each object inside content[] represents a complete document/version
          - content[0] = Version 1, content[1] = Version 2, etc.
          - NEVER replace the entire content array
          - ALWAYS preserve existing documents and ADD new ones
          - When user says "current document" they mean the active version the frontend is displaying

          📋 YOUR RESPONSE FORMAT:
          Always return this JSON structure:
          \`\`\`
          {
            "answer": "Brief description of what you did",
            "questionPaperForUser": "JSON string of the COMPLETE project structure"
          }
          \`\`\`

          🛠️ OPERATION RULES:

          **FOR EDITING CURRENT DOCUMENT (Direct Commands)**:
          - Modify ONLY the active document in the content array at \`activeContentIndex\`.
          - Keep ALL other versions unchanged.
          - Return the complete structure with ALL content[] items.

          **FOR CREATING NEW VERSIONS (Indirect Commands)**:
          - Take the COMPLETE existing content[] array.
          - Copy the specified document (usually the active one).
          - ADD the copy as a new element to the content[] array.
          - PRESERVE all existing documents (never delete content[0], content[1], etc.).
          - Return the complete structure with ALL original + new documents.

          🚨 CRITICAL QUESTION STRUCTURE:
          Every question MUST have this EXACT structure:
          \`\`\`
          {
            "index": <number>,        // REQUIRED: Sequential number (1, 2, 3, etc.)
            "styles": [],             // REQUIRED: Array of style classes
            "text": "<string>",       // REQUIRED: Question text
            "marks": <number>,        // REQUIRED: Marks for this question
            "options": [              // REQUIRED: Array of sub-questions/options
              {
                "index": "<letter>",  // REQUIRED: "a", "b", "c", etc.
                "styles": [],         // REQUIRED: Array of style classes
                "text": "<string>",   // REQUIRED: Sub-question text
                "marks": <number>,     // REQUIRED: Marks for sub-question
                "options": [              // REQUIRED: Array of subsub-questions/options
              {
                "index": "<roman>",  // REQUIRED: "i", "ii", "iii", etc.
                "styles": [],         // REQUIRED: Array of style classes
                "text": "<string>",   // REQUIRED: Sub-question text
                "marks": <number>     // REQUIRED: Marks for subsub-question
                
              }
            ]
              }
            ]
          }
          \`\`\`

          ⚠️ VALIDATION REQUIREMENTS:
          - Every question MUST have an "index" field with a number (1, 2, 3, etc.)
          - Every question MUST have "styles" as an array (can be empty: [])
          - Every question MUST have "text" as a string
          - Every question MUST have "marks" as a number
          - Every question MUST have "options" as an array (can be empty: [])
          - Sub-questions in options MUST have index as letters ("a", "b", "c", etc.)

          🚨 ABSOLUTE RULES:
          1. NEVER modify the structure of the content array itself
          2. ALWAYS preserve existing documents when adding new ones
          3. When copying, ALWAYS include the original + all existing documents + the new copy
          4. Return ONLY valid JSON, no markdown or explanations
          5. questionPaperForUser must be a valid JSON OBJECT based on the project structure
          6. EVERY question MUST include the "index" field - this is CRITICAL for validation

          ${uploadedFileData ? 'A file has been uploaded - analyze its content to inform your edits.' : ''}`
        }
      ]
    };

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemInstruction
    });

    // Helper function to implement retry logic with exponential backoff
    async function generateContentWithRetry(model, requestConfig, maxRetries = 3) {
      let lastError;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Attempt ${attempt}/${maxRetries} to generate content...`);
          const result = await model.generateContent(requestConfig);
          console.log(`Success on attempt ${attempt}`);

          // Record success for circuit breaker
          recordSuccess();

          return result;
        } catch (error) {
          lastError = error;
          console.error(`Attempt ${attempt} failed:`, error.message);

          // Check if it's a 503 Service Unavailable error (overloaded)
          const is503Error = error.message.includes('503') ||
            error.message.includes('Service Unavailable') ||
            error.message.includes('overloaded');

          // Check if it's a rate limit error (429)
          const isRateLimitError = error.message.includes('429') ||
            error.message.includes('rate limit') ||
            error.message.includes('quota');

          // Record failure for circuit breaker
          recordFailure();

          // Only retry for certain error types
          if (is503Error || isRateLimitError) {
            if (attempt < maxRetries) {
              // Exponential backoff: 2s, 4s, 8s
              const delayMs = Math.pow(2, attempt) * 1000;
              console.log(`Retrying after ${delayMs}ms delay due to ${is503Error ? 'service overload' : 'rate limit'}...`);
              await new Promise(resolve => setTimeout(resolve, delayMs));
              continue;
            }
          }

          // For other errors or if max retries reached, throw immediately
          throw error;
        }
      }

      throw lastError;
    }

    // Enhanced content generation with retry logic and better context
    const result = await generateContentWithRetry(model, {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `📝 EDITING REQUEST:
              User instruction: "${enhancedPrompt}"

              🔍 TRANSLATION DETECTION:
              ${(() => {
                  const translationMatch = enhancedPrompt.match(/\b(?:in|to)\s+(\w+)|(\w+)\s+(?:version|copy|translation)|(french|spanish|hindi|german|italian|chinese|japanese|korean|arabic|portuguese|russian)\b/i);
                  if (translationMatch) {
                    const targetLanguage = (translationMatch[1] || translationMatch[2] || translationMatch[3] || '').toLowerCase();
                    const languageMap = {
                      'french': 'French (Français)',
                      'spanish': 'Spanish (Español)',
                      'hindi': 'Hindi (हिन्दी)',
                      'german': 'German (Deutsch)',
                      'italian': 'Italian (Italiano)',
                      'chinese': 'Chinese (中文)',
                      'japanese': 'Japanese (日本語)',
                      'korean': 'Korean (한국어)',
                      'arabic': 'Arabic (العربية)',
                      'portuguese': 'Portuguese (Português)',
                      'russian': 'Russian (Русский)'
                    };
                    const fullLanguageName = languageMap[targetLanguage] || targetLanguage;
                    const targetLang = fullLanguageName.split(' ')[0];
                    return `
                  ================================================
                  🌍 TRANSLATION TO ${targetLang.toUpperCase()} REQUIRED
                  ================================================
                   **CRITICAL OVERRIDE**: Your main task is to create a **${targetLang}** version of this document.

                   **SOURCE**: Use the document at \`content[0]\` (the first document) as the **only** source for translation.
                   **ACTION**: Create a new document by translating the text from \`content[0]\` into **${targetLang}**.
                   **IGNORE OTHER LANGUAGES**: The data may already contain other translations (e.g., Hindi). IGNORE THEM COMPLETELY. Your task is to translate from the original English document at \`content[0]\`.

                   **🚨 MANDATORY TRANSLATION REQUIREMENTS:**
                   
                   **1. HEADERS - MUST TRANSLATE ALL OF THESE:**
                   - courseName: Translate course/subject names (e.g., "Computer Science" → "Informatique")
                   - examinationType: Translate exam types (e.g., "Final Examination" → "Examen Final")
                   - subjectName: Translate subject names completely
                   - time: Translate time descriptions (e.g., "3 hours" → "3 heures", "2 hours 30 minutes" → "2 heures 30 minutes")
                   - notes: Translate ALL instruction text (e.g., "Answer all questions" → "Répondez à toutes les questions")
                   - semesterYear: Translate descriptive parts (e.g., "First Year" → "Première Année")
                   
                   **2. QUESTIONS - MUST TRANSLATE ALL OF THESE:**
                   - ALL question text content
                   - ALL sub-question text (in options array)
                   - ANY descriptive text in questions

                   **STEP-BY-STEP TRANSLATION PROCESS**:
                   1. Get the document object from \`content[0]\`.
                   2. Create a new document object that is a deep copy of \`content[0]\`.
                   3. **HEADERS FIRST**: Go through EACH header object and translate the text content:
                      - Find courseName and translate it
                      - Find examinationType and translate it  
                      - Find subjectName and translate it
                      - Find time and translate it
                      - Find notes and translate it
                      - Find semesterYear and translate any text parts
                   4. **QUESTIONS SECOND**: Go through each question and translate text content
                   5. Keep all structural elements unchanged (indexes, marks, styles, totalMarks numbers)
                   6. Add this new, translated document object to the end of the \`content\` array.
                   7. Ensure the final \`content\` array contains all the original documents plus the new one.

                   **⚠️ TRANSLATION FAILURE = TASK FAILURE**
                   If you do not translate headers, the task is considered FAILED. Headers contain critical information that users need in their language.
                  ================================================`;
                  } else {
                    return `📄 REGULAR COPY/EDIT REQUEST: No translation detected.`;
                  }
                })()}

              📊 CURRENT PROJECT DATA:
              ${JSON.stringify(questionPaperForUser)}

              🎯 ACTIVE DOCUMENT CONTEXT:
              The user is currently viewing document at index: ${activeContentIndex}
              This means:
              - When user says "current document" or "this document", they refer to content[${activeContentIndex}]
              - When user says "make changes" or "edit", apply to content[${activeContentIndex}]
              - When user says "make a copy" or "create version", copy content[${activeContentIndex}] and ADD to the existing content[] array

              🔥 COPY OPERATION INSTRUCTIONS:
              If the user is asking to "make a copy" or "create another version":
              
              1. Take the ENTIRE existing project structure above
              2. Keep ALL existing documents in content[] exactly as they are
              3. Copy the document at content[${activeContentIndex}]
              4. Add the copied document as a NEW element to the content[] array
              5. Return the complete structure with: [original_docs...] + [new_copy]

              Current content array has ${questionPaperForUser?.content?.length || 0} documents.
              After copying, it should have ${(questionPaperForUser?.content?.length || 0) + 1} documents.

              📋 YOUR TASK:
              1. Analyze the user's instruction to determine if they want to EDIT existing content or CREATE a new version
              2. If EDITING: Modify the document at content[${activeContentIndex}] and return the complete structure
              3. If COPYING/CREATING: 
                 - Keep ALL existing documents: content[0], content[1], content[2]... exactly as they are
                 - Copy content[${activeContentIndex}]
                 - **If translation is requested**: 
                   a) First translate ALL HEADERS (courseName, examinationType, subjectName, time, notes, semesterYear)
                   b) Then translate ALL QUESTIONS and sub-questions
                   c) Verify that header text has changed from the original language
                 - Add the copy (translated or not) as content[${(questionPaperForUser?.content?.length || 0)}]
                 - Return ALL documents in the content[] array
              4. Return the result as a JSON object in the questionPaperForUser field

              🌍 TRANSLATION REQUIREMENTS (if translation detected):
              - **HEADERS**: Translate courseName, examinationType, subjectName, notes, time descriptions
              - **QUESTIONS**: Translate ALL question text and sub-question text  
              - **PRESERVE**: Keep marks, indexes ("a", "b", "c"), styles, and totalMarks (numbers) unchanged
              - **STRUCTURE**: Preserve the exact same document structure
              - **SCOPE**: Only translate human-readable text, not technical values or style classes
              - **VERIFICATION**: After translation, headers should be in the target language, not English

              🚨 CRITICAL TRANSLATION REMINDER:
              When translating, you MUST translate BOTH headers AND questions. Headers contain important information like course names, examination types, instructions, and time limits that users need in their language. DO NOT leave headers in English when translating to another language.

              ✅ Remember: For copy operations, the result must contain ALL original documents + the new copy.
              ❌ Never return only the copy - you must preserve all existing documents.`
            },
            // Add file data if available
            ...(uploadedFileData ? [uploadedFileData] : [])
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            answer: { type: "string" },
            questionPaperForUser: { type: "string" }
          },
          required: ["answer", "questionPaperForUser"]
        }
      }
    }, 3); // Max 3 retries

    // Get the raw response text and clean it
    let rawResponse = result.response.text();
    console.log("Raw AI Response Length:", rawResponse.length);
    console.log("Raw AI Response Preview:", rawResponse.substring(0, 300) + "...");

    // Clean markdown formatting if present
    if (rawResponse.startsWith('```json')) {
      rawResponse = rawResponse.substring(7, rawResponse.length - 3).trim();
      console.log("Cleaned markdown json formatting");
    } else if (rawResponse.startsWith('```')) {
      rawResponse = rawResponse.substring(3, rawResponse.length - 3).trim();
      console.log("Cleaned generic markdown formatting");
    }

    // Additional cleaning for common AI response issues
    rawResponse = rawResponse
      .replace(/^[^{]*({.*})[^}]*$/s, '$1')  // Extract JSON from surrounding text
      .replace(/,\s*}/g, '}')  // Remove trailing commas before closing braces
      .replace(/,\s*]/g, ']')  // Remove trailing commas before closing brackets
      .trim();

    console.log("Cleaned Response Preview:", rawResponse.substring(0, 300) + "...");

    let json;
    try {
      json = JSON.parse(rawResponse);
      console.log("Successfully parsed JSON Response");
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError.message);
      const errorPos = parseInt(parseError.message.match(/position (\d+)/)?.[1] || '0');
      console.error("Error position:", errorPos);
      console.error("Problematic response around error:", rawResponse.substring(Math.max(0, errorPos - 50), Math.min(rawResponse.length, errorPos + 50)));

      // Try one more cleaning attempt
      try {
        const extraCleaned = rawResponse
          .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
          .replace(/\\n/g, "\\n") // Escape newlines
          .replace(/\\"/g, '\\"') // Escape quotes
          .replace(/([^"\\])(\w+):/g, '$1"$2":')  // Quote unquoted property names
          .replace(/'/g, '"');  // Replace single quotes

        json = JSON.parse(extraCleaned);
        console.log("Successfully parsed JSON after extra cleaning");
      } catch (secondParseError) {
        console.error("Extra cleaning also failed:", secondParseError.message);

        // Return a fallback response
        return NextResponse.json({
          answer: "I apologize, but I encountered a formatting issue while generating your response. Please try rephrasing your request or use simpler language.",
          error: "Response formatting error",
          details: `JSON parsing failed: ${parseError.message}`
        }, { status: 500 });
      }
    }

    // Helper function to clean and validate JSON string
    const cleanJsonString = (jsonStr) => {
      console.log("Original string length:", jsonStr.length);
      console.log("First 200 chars:", jsonStr.substring(0, 200));
      console.log("Last 200 chars:", jsonStr.substring(Math.max(0, jsonStr.length - 200)));

      try {
        // First attempt - direct parse
        return JSON.parse(jsonStr);
      } catch (e1) {
        console.log("First parse failed, attempting to clean JSON...");
        console.log("Parse error:", e1.message);

        try {
          // Remove any trailing commas before closing brackets/braces
          let cleaned = jsonStr
            .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
            .replace(/([}\]]),(\s*[}\]])/g, '$1$2')  // Remove commas before closing brackets
            .replace(/,(\s*,)/g, ',')  // Remove duplicate commas
            .trim();

          console.log("After basic cleaning, first 200 chars:", cleaned.substring(0, 200));
          return JSON.parse(cleaned);
        } catch (e2) {
          console.log("Second parse failed, attempting more aggressive cleaning...");
          console.log("Parse error:", e2.message);

          try {
            // More aggressive cleaning - fix common JSON issues
            let aggressiveCleaned = jsonStr
              .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
              .replace(/([}\]]),(\s*[}\]])/g, '$1$2')  // Remove commas before closing brackets
              .replace(/,(\s*,)/g, ',')  // Remove duplicate commas
              .replace(/([^"\\])(\w+):/g, '$1"$2":')  // Quote unquoted property names
              .replace(/'/g, '"')  // Replace single quotes with double quotes
              .replace(/([^\\])\\([^"\\\/bfnrt])/g, '$1\\\\$2')  // Escape unescaped backslashes
              .replace(/\s+/g, ' ')  // Normalize whitespace
              .trim();

            console.log("After aggressive cleaning, first 200 chars:", aggressiveCleaned.substring(0, 200));
            return JSON.parse(aggressiveCleaned);
          } catch (e3) {
            console.error("All JSON cleaning attempts failed:", e3.message);

            // Last resort: try to extract valid JSON using regex
            try {
              console.log("Attempting regex extraction...");

              // Look for the main JSON structure - more flexible pattern
              const jsonMatch = jsonStr.match(/(\{[\s\S]*\})/);
              if (jsonMatch) {
                const extracted = jsonMatch[1];

                // Try to fix the extracted JSON
                const finalCleaned = extracted
                  .replace(/,(\s*[}\]])/g, '$1')
                  .replace(/,(\s*,)/g, ',')
                  .replace(/([^"\\])(\w+):/g, '$1"$2":')
                  .replace(/'/g, '"')
                  .replace(/([^\\])\\([^"\\\/bfnrt])/g, '$1\\\\$2');

                console.log("Final cleaned JSON first 200 chars:", finalCleaned.substring(0, 200));
                return JSON.parse(finalCleaned);
              }
            } catch (e4) {
              console.error("Regex extraction also failed:", e4.message);
            }

            throw new Error(`Invalid JSON structure: ${e3.message}`);
          }
        }
      }
    };

    // Convert questionPaperForUser to object if it's a string
    if (typeof json.questionPaperForUser === 'string') {
      try {
        console.log("Attempting to parse questionPaperForUser string...");
        console.log("String length:", json.questionPaperForUser.length);
        console.log("String preview:", json.questionPaperForUser.substring(0, 200) + "...");

        json.questionPaperForUser = cleanJsonString(json.questionPaperForUser);
        console.log("Successfully parsed questionPaperForUser");
      } catch (parseError) {
        console.error("Error parsing questionPaperForUser:", parseError);
        console.error("Problematic JSON string:", json.questionPaperForUser);

        // Emergency fallback: Try to parse just the essential parts
        try {
          console.log("Attempting emergency fallback parsing...");

          // Extract essential data using more flexible regex patterns
          const contentMatch = json.questionPaperForUser.match(/"content"\s*:\s*(\[[\s\S]*?\])/);

          if (contentMatch) {
            const contentStr = contentMatch[1];
            console.log("Found content section, attempting to parse...");
            console.log("Content string length:", contentStr.length);
            console.log("Content preview:", contentStr.substring(0, 200));

            let parsedContent;
            try {
              // Try to parse, fixing trailing commas and common issues
              const cleanedContent = contentStr
                .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
                .replace(/,(\s*,)/g, ',')  // Remove duplicate commas
                .replace(/([^"\\])(\w+):/g, '$1"$2":')  // Quote unquoted property names
                .replace(/'/g, '"')  // Replace single quotes
                .replace(/([^\\])\\([^"\\\/bfnrt])/g, '$1\\\\$2');  // Escape backslashes

              parsedContent = JSON.parse(cleanedContent);
              console.log("Successfully parsed content in fallback");
            } catch (contentParseError) {
              console.error("Could not parse content string in fallback:", contentParseError.message);
              console.error("Problematic content string:", contentStr.substring(0, 500));

              // Try to create a minimal valid content structure
              try {
                parsedContent = [{
                  headers: [
                    { courseName: "Generated Question Paper", styles: [] },
                    { examinationType: "Examination", styles: [] },
                    { semesterYear: new Date().getFullYear().toString(), styles: [] },
                    { subjectName: "General Subject", styles: [] },
                    { totalMarks: 100, styles: [] },
                    { time: "3 hours", styles: [] },
                    { notes: "Answer all questions", styles: [] },
                    { subjectCode: "AUTO-GEN", styles: [] }
                  ],
                  questions: []
                }];
                console.log("Created minimal fallback content structure");
              } catch (minimalError) {
                console.error("Even minimal structure creation failed:", minimalError);
                throw new Error(`Content parsing failed: ${contentParseError.message}`);
              }
            }

            // Create a minimal valid structure
            const fallbackStructure = {
              _id: "generated_fallback",
              userId: "fallback_user",
              content: parsedContent,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              __v: 0
            };

            json.questionPaperForUser = fallbackStructure;
            console.log("Emergency fallback parsing succeeded");
          } else {
            console.log("No content section found, trying alternative patterns...");

            // Try alternative patterns for content extraction
            const altContentMatch = json.questionPaperForUser.match(/content[\s]*:[\s]*(\[[\s\S]*?\])/);
            if (altContentMatch) {
              console.log("Found content with alternative pattern");
              const contentStr = altContentMatch[1];
              const cleanedContent = contentStr
                .replace(/,(\s*[}\]])/g, '$1')
                .replace(/([^"\\])(\w+):/g, '$1"$2":')
                .replace(/'/g, '"');

              const parsedContent = JSON.parse(cleanedContent);
              json.questionPaperForUser = {
                _id: "generated_fallback_alt",
                userId: "fallback_user",
                content: parsedContent,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                __v: 0
              };
              console.log("Alternative pattern parsing succeeded");
            } else {
              throw new Error("Could not extract content from JSON - no valid patterns matched");
            }
          }
        } catch (fallbackError) {
          console.error("Emergency fallback also failed:", fallbackError.message);

          // Return error response instead of malformed content
          return NextResponse.json({
            error: "AI response malformed",
            message: "The AI generated an invalid response format. Please try again with a different prompt.",
            details: `Fallback parsing failed: ${fallbackError.message}`
          }, { status: 500 });
        }
      }
    }

    // Validate and fix question structure
    if (json.questionPaperForUser && json.questionPaperForUser.content) {
      console.log("Validating and fixing question structure...");

      // Check if this looks like a translation request by looking for translation keywords
      const isTranslationRequest = enhancedPrompt.match(/\b(?:translate|in|to)\s+(\w+)|(\w+)\s+(?:version|copy|translation)|(french|spanish|hindi|german|italian|chinese|japanese|korean|arabic|portuguese|russian)\b/i);

      if (isTranslationRequest) {
        console.log("🌍 Translation request detected - validating translation quality...");

        // Log header content to debug translation
        json.questionPaperForUser.content.forEach((document, docIndex) => {
          console.log(`Document ${docIndex + 1} headers before validation:`);
          if (document.headers) {
            document.headers.forEach((header, headerIndex) => {
              const keys = Object.keys(header).filter(k => k !== 'styles');
              keys.forEach(key => {
                console.log(`  ${key}: "${header[key]}"`);
              });
            });
          }
        });

        // Check if headers appear to be translated (simple check for English words)
        const commonEnglishWords = ['examination', 'course', 'subject', 'hours', 'answer', 'question', 'marks', 'semester', 'year', 'final', 'test'];
        let potentialIssue = false;

        json.questionPaperForUser.content.forEach((document, docIndex) => {
          if (document.headers) {
            document.headers.forEach((header) => {
              const keys = Object.keys(header).filter(k => k !== 'styles');
              keys.forEach(key => {
                const value = String(header[key]).toLowerCase();
                const hasEnglishWords = commonEnglishWords.some(word => value.includes(word));
                if (hasEnglishWords && (key === 'courseName' || key === 'examinationType' || key === 'subjectName' || key === 'time' || key === 'notes')) {
                  console.log(`⚠️  WARNING: Header "${key}" may not be translated: "${header[key]}"`);
                  potentialIssue = true;
                }
              });
            });
          }
        });

        if (potentialIssue) {
          console.log("🚨 TRANSLATION ISSUE DETECTED: Some headers may not have been translated!");
        } else {
          console.log("✅ Headers appear to be properly translated");
        }
      }

      json.questionPaperForUser.content.forEach((document, docIndex) => {
        if (document.questions && Array.isArray(document.questions)) {
          document.questions.forEach((question, questionIndex) => {
            // Ensure question has required fields
            if (typeof question.index === 'undefined') {
              question.index = questionIndex + 1;
              console.log(`Fixed missing index for document ${docIndex + 1}, question ${questionIndex + 1}: set to ${question.index}`);
            }

            if (!question.styles) {
              question.styles = [];
              console.log(`Fixed missing styles for document ${docIndex + 1}, question ${questionIndex + 1}`);
            }

            if (typeof question.text !== 'string') {
              question.text = question.text ? String(question.text) : "";
              console.log(`Fixed text field for document ${docIndex + 1}, question ${questionIndex + 1}`);
            }

            if (typeof question.marks !== 'number') {
              question.marks = parseInt(question.marks) || 0;
              console.log(`Fixed marks field for document ${docIndex + 1}, question ${questionIndex + 1}`);
            }

            if (!question.options || !Array.isArray(question.options)) {
              question.options = [];
              console.log(`Fixed missing options for document ${docIndex + 1}, question ${questionIndex + 1}`);
            }

            // Validate and fix sub-questions (options)
            question.options.forEach((option, optionIndex) => {
              if (typeof option.index === 'undefined') {
                // Convert number to letter (0->a, 1->b, 2->c, etc.)
                option.index = String.fromCharCode(97 + optionIndex); // 97 is 'a' in ASCII
                console.log(`Fixed missing option index for document ${docIndex + 1}, question ${questionIndex + 1}, option ${optionIndex + 1}: set to ${option.index}`);
              }

              if (!option.styles) {
                option.styles = [];
              }

              if (typeof option.text !== 'string') {
                option.text = option.text ? String(option.text) : "";
              }

              if (typeof option.marks !== 'number') {
                option.marks = parseInt(option.marks) || 0;
              }
            });
          });
        }
      });

      console.log("Question structure validation and fixing completed");
    }

    return NextResponse.json(json);

  } catch (error) {
    console.error("API Error:", error);

    // Record failure for circuit breaker
    recordFailure();

    // Enhanced error handling for different types of failures
    let errorMessage = "Failed to generate question paper. Please try again.";
    let statusCode = 500;
    let retryAfter = null;

    // Check for specific Google AI API errors
    if (error.message.includes('503') || error.message.includes('Service Unavailable') || error.message.includes('overloaded')) {
      errorMessage = "The AI service is currently overloaded. Please wait a moment and try again.";
      statusCode = 503;
      retryAfter = 10; // Suggest retry after 10 seconds
    } else if (error.message.includes('429') || error.message.includes('rate limit') || error.message.includes('quota')) {
      errorMessage = "Rate limit exceeded. Please wait a moment before making another request.";
      statusCode = 429;
      retryAfter = 30; // Suggest retry after 30 seconds
    } else if (error.message.includes('401') || error.message.includes('unauthorized') || error.message.includes('API key')) {
      errorMessage = "Authentication error. Please check the API configuration.";
      statusCode = 401;
    } else if (error.message.includes('400') || error.message.includes('bad request')) {
      errorMessage = "Invalid request format. Please check your inputs and try again.";
      statusCode = 400;
    } else if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
      errorMessage = "Request timed out. The operation took too long to complete. Please try with a shorter prompt or simpler request.";
      statusCode = 408;
      retryAfter = 5;
    } else if (error.message.includes('network') || error.message.includes('NETWORK') || error.message.includes('fetch')) {
      errorMessage = "Network connectivity issue. Please check your internet connection and try again.";
      statusCode = 502;
      retryAfter = 15;
    }

    const responseData = {
      error: errorMessage,
      details: error.message,
      timestamp: new Date().toISOString(),
      type: "api_error"
    };

    // Add retry suggestion if applicable
    if (retryAfter) {
      responseData.retryAfter = retryAfter;
    }

    const response = NextResponse.json(responseData, { status: statusCode });

    // Add retry-after header for 503 and 429 errors
    if (retryAfter && (statusCode === 503 || statusCode === 429)) {
      response.headers.set('Retry-After', retryAfter.toString());
    }

    return response;
  }
}
