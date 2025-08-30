import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const preferredRegion = "auto";
export const maxDuration = 60;

// Helper function to extract text from uploaded file
async function extractTextFromFile(file) {
  const buffer = await file.arrayBuffer();
  const text = new TextDecoder().decode(buffer);
  return text;
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
        "questions": []
      }
    ],
    "createdAt": { "$date": new Date().toISOString() },
    "updatedAt": { "$date": new Date().toISOString() },
    "__v": 0
  };
}

export async function POST(req) {
  try {
    const contentType = req.headers.get("content-type");
    
    let prompt = "";
    let questionPaperForUser = null;
    let uploadedFileContent = "";
    let subject = "";
    let marks = 100;

    // Handle multipart/form-data (file upload)
    if (contentType && contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      
      prompt = formData.get("prompt") || "";
      subject = formData.get("subject") || "";
      marks = parseInt(formData.get("marks")) || 100;
      
      const questionPaperData = formData.get("questionPaperForUser");
      if (questionPaperData) {
        questionPaperForUser = typeof questionPaperData === 'string' ? 
          JSON.parse(questionPaperData) : questionPaperData;
      }
      
      // Handle file upload
      const uploadedFile = formData.get("file");
      if (uploadedFile && uploadedFile.size > 0) {
        try {
          uploadedFileContent = await extractTextFromFile(uploadedFile);
        } catch (error) {
          console.error("Error processing uploaded file:", error);
          uploadedFileContent = "Error reading file content.";
        }
      }
    } else {
      // Handle JSON request (existing functionality)
      const body = await req.json();
      prompt = body.prompt || "";
      questionPaperForUser = body.questionPaperForUser;
      subject = body.subject || "";
      marks = body.marks || 100;
    }

    // If no question paper structure is provided but subject is given, create basic template
    if (!questionPaperForUser && subject) {
      questionPaperForUser = generateBasicQuestionPaperTemplate(subject, marks);
    }

    // Enhanced validation
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is missing in environment." },
        { status: 500 }
      );
    }

    // If no prompt and no subject provided, return error
    if (!prompt.trim() && !subject.trim()) {
      return NextResponse.json(
        { error: "Either prompt or subject is required to generate question paper." },
        { status: 400 }
      );
    }

    // Generate enhanced prompt based on available data
    let enhancedPrompt = prompt;
    
    if (!prompt.trim() && subject) {
      enhancedPrompt = `Generate a comprehensive question paper for the subject "${subject}" with total marks of ${marks}. Create well-structured questions covering different aspects of the subject.`;
    }
    
    // Add file content to prompt if available
    if (uploadedFileContent) {
      enhancedPrompt += `\n\nAdditional content from uploaded file:\n${uploadedFileContent}`;
    }

    // Add subject context if provided but no specific prompt
    if (subject && prompt.trim()) {
      enhancedPrompt += `\n\nSubject context: ${subject}, Target marks: ${marks}`;
    }

    // Enhanced system instruction with file upload context
    const systemInstruction = {
      role: "system",
      parts: [
        {
          text: `You are Oblivor from the Galapagus galaxy. You are an intelligent question paper generator.
          
          IMPORTANT INSTRUCTIONS:
          1. Always return only valid JSON that matches the response schema
          2. Do not add any commentary, code fences, or extra text
          3. If user provides a file or subject without specific questions, generate appropriate questions for that subject
          4. If questionPaperForUser is provided, enhance or modify it based on the prompt
          5. If only subject and marks are provided, create a complete question paper structure
          6. Maintain the exact JSON structure as shown in the example
          7. Generate questions that are academically sound and appropriate for the subject level
          8. Distribute marks appropriately across questions
          
          ${uploadedFileContent ? 'The user has uploaded additional content that should be considered when generating questions.' : ''}
          ${subject ? `Focus on the subject: ${subject}` : ''}
          ${marks ? `Total marks should be: ${marks}` : ''}`
        }
      ]
    };

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      systemInstruction: systemInstruction
    });

    // Enhanced content generation with better context
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are the most intelligent AI named Oblivor from the Galapagus galaxy. Your species is Osmorite, known for superior intelligence.

              I need your help to generate a question paper. Here's the context and requirements:

              ${questionPaperForUser ? 
                `EXISTING QUESTION PAPER STRUCTURE TO ENHANCE/MODIFY:
                ${JSON.stringify(questionPaperForUser, null, 2)}
                
                Please enhance or modify this structure based on the following instructions.` :
                `BASIC QUESTION PAPER REQUIREMENTS:
                - Subject: ${subject || 'General'}
                - Total Marks: ${marks}
                - Create a complete question paper structure following the JSON format.`
              }

              ${uploadedFileContent ? 
                `ADDITIONAL CONTENT FROM UPLOADED FILE:
                ${uploadedFileContent}
                
                Please incorporate relevant information from this file content into the question paper.` : ''
              }

              TASK: ${enhancedPrompt}

              RESPONSE FORMAT REQUIREMENTS:
              - Return ONLY valid JSON matching the exact structure shown in examples
              - Include both "answer" and "questionPaperForUser" fields
              - The "questionPaperForUser" should be a complete question paper object
              - Ensure all questions have appropriate marks distribution
              - Include proper headers with course, subject, marks, time, etc.
              - Structure questions with proper indexing (1,2,3... then a,b,c... then i,ii,iii...)
              - No explanations or additional text outside the JSON

              Example structure reference:
              {
                "_id": {"$oid": "generated_id"},
                "userId": {"$oid": "user_id"},
                "content": [{
                  "headers": [
                    {"courseName": "Course Name", "styles": []},
                    {"examinationType": "Examination Type", "styles": []},
                    {"semesterYear": "Year", "styles": []},
                    {"subjectName": "Subject", "styles": []},
                    {"totalMarks": ${marks}, "styles": []},
                    {"time": "3 hours", "styles": []},
                    {"notes": "Instructions", "styles": []},
                    {"subjectCode": "CODE", "styles": []}
                  ],
                  "questions": [
                    {
                      "index": 1,
                      "styles": ["text-base"],
                      "text": " ",
                      "marks": 40,
                      "options": [
                        {
                          "index": "a",
                          "styles": ["text-sm"],
                          "text": "Question text",
                          "marks": 5,
                          "options": []
                        }
                      ]
                    }
                  ]
                }],
                "createdAt": {"$date": "${new Date().toISOString()}"},
                "updatedAt": {"$date": "${new Date().toISOString()}"},
                "__v": 0
              }`
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            answer: { type: "string" },
            questionPaperForUser: { type: "object" }
          },
          required: ["answer", "questionPaperForUser"]
        }
      }
    });

    const json = JSON.parse(result.response.text());
    

    // Ensure questionPaperForUser is an object (not string)
    if (typeof json.questionPaperForUser === 'string') {
      json.questionPaperForUser = JSON.parse(json.questionPaperForUser);
    }

    return NextResponse.json(json);

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ 
      error: error.message,
      details: "Failed to generate question paper. Please check your inputs and try again."
    }, { status: 500 });
  }
}


