import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const preferredRegion = "auto";
export const maxDuration = 60;

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
    let uploadedFileData = null;

    // Handle multipart/form-data (file upload)
    if (contentType && contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      
      prompt = formData.get("prompt") || "";
      
      const questionPaperData = formData.get("questionPaperForUser");
      if (questionPaperData) {
        questionPaperForUser = typeof questionPaperData === 'string' ? 
          JSON.parse(questionPaperData) : questionPaperData;
      }
      
      // Handle file upload
      const uploadedFile = formData.get("file");
      if (uploadedFile && uploadedFile.size > 0) {
        try {
          uploadedFileData = await prepareFileForGoogleAI(uploadedFile);
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

    // Generate enhanced prompt based on available data
    let enhancedPrompt = prompt;
    
    // Add file instruction if file is uploaded
    if (uploadedFileData) {
      enhancedPrompt += `\n\nNote: A file has been uploaded. Please analyze the file content and incorporate relevant information into the question paper generation.`;
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
          9. Extract subject and marks information from the user's prompt
          
          ${uploadedFileData ? 'The user has uploaded a file. Please analyze the file content and incorporate relevant information into the question paper.' : ''}`
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
                - Extract subject name and total marks from the user's prompt
                - Create a complete question paper structure following the JSON format
                - If no specific marks mentioned, use 100 as default`
              }

              ${uploadedFileData ? 'UPLOADED FILE: Please analyze the uploaded file and incorporate relevant information from it into the question paper generation.' : ''}

              TASK: ${enhancedPrompt}

              RESPONSE FORMAT REQUIREMENTS:
              - Return ONLY valid JSON matching the exact structure shown in examples
              - DO NOT use markdown formatting (no triple backticks with json or empty backticks)
              - DO NOT include any text before or after the JSON
              - Include both "answer" and "questionPaperForUser" fields
              - The "answer" should be a string describing what was generated
              - The "questionPaperForUser" should be a JSON STRING (not object) containing the complete question paper
              - Ensure all questions have appropriate marks distribution
              - Include proper headers with course, subject, marks, time, etc.
              - Structure questions with proper indexing (1,2,3... then a,b,c... then i,ii,iii...)
              - Start response directly with { and end with }

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
                    {"totalMarks": 100, "styles": []},
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
    });

    // Enhanced JSON cleaning function
    function cleanJsonString(jsonStr) {
      return jsonStr
        // Remove markdown formatting
        .replace(/```json\s*/g, '').replace(/```\s*$/g, '')
        .replace(/```\s*/g, '')
        // Extract JSON from surrounding text
        .replace(/^[^{]*({.*})[^}]*$/s, '$1')
        // Fix common JSON issues
        .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
        .replace(/([{,]\s*)"([^"]+)":\s*([^,}\]]+)([,}\]])/g, (match, prefix, key, value, suffix) => {
          // Quote unquoted string values
          if (value.trim() && !value.trim().startsWith('"') && !value.trim().startsWith('[') && !value.trim().startsWith('{') && isNaN(value.trim())) {
            value = `"${value.trim().replace(/"/g, '\\"')}"`;
          }
          return `${prefix}"${key}": ${value}${suffix}`;
        })
        // Fix multiple spaces and newlines in strings
        .replace(/"\s*\n\s*"/g, '" "')
        // Remove control characters
        .replace(/[\x00-\x1F\x7F]/g, '')
        .trim();
    }

    // Get the raw response text and clean it
    let rawResponse = result.response.text();
    

    // Clean the response
    const cleanedResponse = cleanJsonString(rawResponse);
    

    let json;
    try {
      json = JSON.parse(cleanedResponse);
      
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      console.error("Error at position:", parseError.message.match(/position (\d+)/)?.[1]);
      console.error("Character at error position:", cleanedResponse.charAt(parseInt(parseError.message.match(/position (\d+)/)?.[1]) || 0));
      console.error("Context around error:", cleanedResponse.substring(Math.max(0, (parseInt(parseError.message.match(/position (\d+)/)?.[1]) || 0) - 50), (parseInt(parseError.message.match(/position (\d+)/)?.[1]) || 0) + 50));
      console.error("Problematic response:", cleanedResponse);
      
      // Return a fallback response
      return NextResponse.json({ 
        answer: "I apologize, but I encountered a formatting issue while generating your response. Please try rephrasing your request or use simpler language.",
        error: "Response formatting error",
        details: `JSON parsing failed: ${parseError.message}`
      });
    }

    // Helper function to clean and validate JSON string
    const cleanJsonString = (jsonStr) => {
      
      
      
      try {
        // First attempt - direct parse
        return JSON.parse(jsonStr);
      } catch (e1) {
        
        
        try {
          // Level 1: Basic cleaning
          let cleaned = jsonStr
            .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
            .replace(/([}\]]),(\s*[}\]])/g, '$1$2')  // Remove commas before closing brackets
            .replace(/,(\s*,)/g, ',')  // Remove duplicate commas
            .trim();
          
          return JSON.parse(cleaned);
        } catch (e2) {
          
          
          try {
            // Level 2: Quote unquoted string values
            let cleaned2 = jsonStr
              .replace(/,(\s*[}\]])/g, '$1')
              .replace(/([{,]\s*)"([^"]+)":\s*([^",}\]]+)([,}\]])/g, (match, prefix, key, value, suffix) => {
                const trimmedValue = value.trim();
                if (trimmedValue && 
                    !trimmedValue.startsWith('"') && 
                    !trimmedValue.startsWith('[') && 
                    !trimmedValue.startsWith('{') && 
                    isNaN(trimmedValue) &&
                    trimmedValue !== 'true' &&
                    trimmedValue !== 'false' &&
                    trimmedValue !== 'null') {
                  return `${prefix}"${key}": "${trimmedValue.replace(/"/g, '\\"')}"${suffix}`;
                }
                return match;
              });
            
            return JSON.parse(cleaned2);
          } catch (e3) {
            
            
            try {
              // Level 3: Remove problematic characters
              let cleaned3 = jsonStr
                .replace(/[\x00-\x1F\x7F]/g, '')  // Remove control characters
                .replace(/\n\s*\n/g, '\n')  // Remove empty lines
                .replace(/"\s*\n\s*"/g, '" "')  // Fix broken strings
                .replace(/,(\s*[}\]])/g, '$1');
              
              return JSON.parse(cleaned3);
            } catch (e4) {
              
              
              try {
                // Level 4: Fix unquoted keys
                let cleaned4 = jsonStr
                  .replace(/([{,])\s*([^":\s}{]+):\s*/g, '$1"$2": ')
                  .replace(/,(\s*[}\]])/g, '$1');
                
                return JSON.parse(cleaned4);
              } catch (e5) {
                
                
                try {
                  // Level 5: Emergency cleanup - remove non-printable characters
                  let cleaned5 = jsonStr
                    .replace(/[^\x20-\x7E\s]/g, '')
                    .replace(/,(\s*[}\]])/g, '$1');
                  
                  return JSON.parse(cleaned5);
                } catch (e6) {
                  
                  throw new Error(`JSON parsing failed after all cleaning attempts: ${e1.message}`);
                }
              }
            }
          }
        }
      }
    };
          
          try {
            // More aggressive cleaning
            let aggressiveCleaned = jsonStr
              .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
              .replace(/([}\]]),(\s*[}\]])/g, '$1$2')  // Remove commas before closing brackets
              .replace(/,(\s*,)/g, ',')  // Remove duplicate commas
              .replace(/(\w+):/g, '"$1":')  // Ensure property names are quoted (but preserve already quoted ones)
              .replace(/"(\w+)":/g, '"$1":')  // Clean up double quoting
              .replace(/'/g, '"')  // Replace single quotes with double quotes
              .replace(/([^\\])\\([^"\\\/bfnrt])/g, '$1\\\\$2')  // Escape unescaped backslashes
              .trim();
            
            
            return JSON.parse(aggressiveCleaned);
          } catch (e3) {
            console.error("All JSON cleaning attempts failed:", e3);
            
            // Last resort: try to extract valid JSON using regex
            try {
              
              // Look for the main JSON structure
              const jsonMatch = jsonStr.match(/^(\{.*\})$/s);
              if (jsonMatch) {
                const extracted = jsonMatch[1];
                // Fix common issues in the extracted JSON
                const finalCleaned = extracted
                  .replace(/,(\s*[}\]])/g, '$1')
                  .replace(/,(\s*,)/g, ',')
                  .replace(/([^\\])\\([^"\\\/bfnrt])/g, '$1\\\\$2');
                
                return JSON.parse(finalCleaned);
              }
            } catch (e4) {
              console.error("Regex extraction also failed:", e4);
            }
            
            throw new Error(`Invalid JSON structure: ${e3.message}`);
          }
        }
      }
    };

    // Convert questionPaperForUser to object if it's a string
    if (typeof json.questionPaperForUser === 'string') {
      try {
        
        
        
        
        json.questionPaperForUser = cleanJsonString(json.questionPaperForUser);
        
      } catch (parseError) {
        console.error("Error parsing questionPaperForUser:", parseError);
        console.error("Problematic JSON string:", json.questionPaperForUser);
        
        // Emergency fallback: Try to parse just the essential parts
        try {
          
          
          
          // Try multiple regex patterns to extract content
          let contentMatch = cleanedJson.match(/"content":\s*(\[[\s\S]*?\](?:\s*,\s*"|\s*\}))/);
          
          if (!contentMatch) {
            // Try alternative pattern
            contentMatch = cleanedJson.match(/"content":\s*(\[[\s\S]*?\])(?:\s*[,}])/);
          }
          
          if (!contentMatch) {
            // Try even simpler pattern - just find the content array
            contentMatch = cleanedJson.match(/"content":\s*(\[[^\]]*(?:\][^\]]*)*\])/);
          }
          
          if (contentMatch) {
            let contentStr = contentMatch[1];
            
            
            // Clean the content string more aggressively
            contentStr = contentStr
              .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
              .replace(/([{,]\s*)"([^"]+)":\s*([^,}\]]+)([,}\]])/g, (match, prefix, key, value, suffix) => {
                // Ensure proper JSON formatting for unquoted values
                if (value.trim() && !value.trim().startsWith('"') && !value.trim().startsWith('[') && !value.trim().startsWith('{') && isNaN(value.trim())) {
                  value = `"${value.trim()}"`;
                }
                return `${prefix}"${key}": ${value}${suffix}`;
              });
            
            
            
            // Create a minimal valid structure
            const fallbackStructure = {
              _id: "generated_fallback",
              userId: "fallback_user",
              content: JSON.parse(contentStr),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              __v: 0
            };
            
            json.questionPaperForUser = fallbackStructure;
            
          } else {
            throw new Error("Could not extract content from JSON");
          }
        } catch (fallbackError) {
          console.error("Emergency fallback also failed:", fallbackError);
          
          
          try {
            // Final safety net: construct a basic question paper manually
            const safetyNetStructure = {
              _id: "generated_safety_net",
              userId: "safety_user",
              content: [{
                headers: [
                  { courseName: "Generated Course", styles: ["text-lg", "font-bold"] },
                  { examinationType: "AI Generated Exam", styles: ["text-base", "font-bold"] },
                  { semesterYear: "2025", styles: ["text-base", "font-bold"] },
                  { subjectName: "Subject", styles: ["text-base", "font-normal"] },
                  { totalMarks: "100", styles: ["text-sm", "font-bold"] },
                  { time: "3 hours", styles: ["text-sm", "font-bold"] },
                  { notes: "AI generated content", styles: ["text-sm", "italic"] },
                  { subjectCode: "AI-001", styles: ["font-sans", "font-bold"] },
                  { specialNumber: "001", styles: ["font-sans", "font-bold"] }
                ],
                questions: [
                  {
                    index: 1,
                    text: "AI-generated question based on your request.",
                    marks: 10,
                    styles: ["text-sm"],
                    options: []
                  }
                ]
              }],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              __v: 0
            };
            
            json.questionPaperForUser = safetyNetStructure;
            
            
          } catch (safetyError) {
            console.error("Even safety net failed:", safetyError);
            
            // Absolute final fallback - just return the answer
            return NextResponse.json({ 
              answer: json.answer || "I processed your request, but encountered technical difficulties with the question paper formatting. The AI response was generated but couldn't be properly structured. Please try rephrasing your request or contact support.",
              error: "Complete parsing failure",
              details: `All parsing attempts failed. Original: ${parseError.message}, Fallback: ${fallbackError.message}, Safety: ${safetyError.message}`
            });
          }
        }
      }
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


