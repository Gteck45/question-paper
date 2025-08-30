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

    // Add a system prompt as the first message
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                "your are most inteligent and your name is Oblivor about yourself you are from Galapagus galaxy and a intelegent more than all species your specie is osmorite ",
              text: ` let i help you to understand what i have and and what i need its example data only reply in json do not add any other string remove explations {
      "_id": {
      "$oid": "68af9cc9150cbd15cdaa0208" this feild is represent the project id that only can be one 
      },
      "userId": {
      "$oid": "68af3cb656d259e6724f6433" this feild is represent the userid who is make this entire document
      },
      "content": [
      in inside content i have can be multiple object that can be repeat for another document or another language 
      {
      each object have two main things first is header and second is questions its compalsory that need for each document or object inside content
        "headers": [
        {
          "courseName": "BACHELOR OF COMPUTER APPLICATIONS (Revised)",
          "styles": []
        },
        {
          "examinationType": "Term-End Examination",
          "styles": []
        },
        {
          "semesterYear": "December, 2012",
          "styles": []
        },
        {
          "subjectName": "COMPUTER BASICS AND PC SOFTWARE",
          "styles": []
        },
        {
          "totalMarks": 100,
          "styles": []
        },
        {
          "time": "3 hours",
          "styles": []
        },
        {
          "notes": "Question number 1 is compulsory and carries 40 marks. Attempt any three questions from the rest.",
          "styles": []
        },
        {
          "subjectCode": "BCS-011",
          "styles": []
        },
        {
          "specialNumber": "20",
          "styles": []
        }
        ],
        "questions": [
        there are only three stage nesting first index is for main question second index is for sub question and third index is for options like first(1,2,3,4,....) second (a,b,c,d,....) and third (i,ii,iii,iv,....)
        {
          "index": 1,
          "styles": [
          "text-base"
          ],
          "text": " ",
          "marks": 40,
          "options": [
          {
            "index": "a",
            "styles": [
            "text-sm"
            ],
            "text": "Convert the following hexadecimal numbers to binary and decimal numbers.",
            "marks": 5,
            "options": [
            {
              "index": "i",
              "styles": [
              "text-sm"
              ],
              "text": "(AB)Hex.",
              "marks": 0
            },
            {
              "index": "ii",
              "styles": [
              "text-sm"
              ],
              "text": "(22F) Hex",
              "marks": 0
            }
            ]
          },
          {
            "index": "b",
            "styles": [
            "text-sm"
            ],
            "text": "How do you calculate access time on a magnetic disk? Explain with the help of a suitable example.",
            "marks": 5,
            "options": []
          },
          {
            "index": "c",
            "styles": [
            "text-sm"
            ],
            "text": "What are the basic components of a computer as defined in Von Neumann architecture? What is the use of each of this component ?",
            "marks": 5,
            "options": []
          },
          {
            "index": "d",
            "styles": [
            "text-sm"
            ],
            "text": "Explain the role of a translator program. How is a compiler different than an assembler?",
            "marks": 5,
            "options": []
          },
          {
            "index": "e",
            "styles": [
            "text-sm"
            ],
            "text": "What is an algorithm? What is the relation between a flow chart and an algorithm ? Draw a flowchart to find the sum and average of marks of a student given in 5 different subjects. Marks are given out of 100.",
            "marks": 8,
            "options": []
          },
          {
            "index": "f",
            "styles": [
            "text-sm"
            ],
            "text": "What is a modem? How can it be used for data transmission? How a modem is different from hub ?",
            "marks": 4,
            "options": []
          },
          {
            "index": "g",
            "styles": [
            "text-sm"
            ],
            "text": "What is a DNS ? How is it used for identifying web addresses? Explain with the help of an example.",
            "marks": 5,
            "options": []
          },
          {
            "index": "h",
            "styles": [
            "text-sm"
            ],
            "text": "What is a web browser? Why is it needed ? Name at least three popular web browsers.",
            "marks": 3,
            "options": []
          }
          ]
        },
        {
          "index": 2,
          "styles": [
          "text-sm"
          ],
          "text": " ",
          "marks": 20,
          "options": [
          {
            "index": "a",
            "styles": [
            "text-sm"
            ],
            "text": "Name and the purpose of any four utility programs used on a personal computer.",
            "marks": 6,
            "options": []
          },
          {
            "index": "b",
            "styles": [
            "text-sm"
            ],
            "text": "What are the characteristics and advantages of a Local Area Network ? Explain any one LAN topology with the help of a diagram.",
            "marks": 8,
            "options": []
          },
          {
            "index": "c",
            "styles": [
            "text-sm"
            ],
            "text": "Define the term \"Open Source Software\". Explain any two important features of the model used for open source software development.",
            "marks": 6,
            "options": []
          }
          ]
        },
        {
          "index": 3,
          "styles": [
          "text-sm"
          ],
          "text": " ",
          "marks": 20,
          "options": [
          {
            "index": "a",
            "styles": [
            "text-sm"
            ],
            "text": "Explain the terms (i) Simple batch systems and (ii) time sharing systems in the context of operating systems. How are batch systems different than multiprogramming system.",
            "marks": 8,
            "options": []
          },
          {
            "index": "b",
            "styles": [
            "text-sm"
            ],
            "text": "Explain the different types of main memories that are part of a computer system. Why do you need secondary memories in a computer even if sufficient primary memory may be available ?",
            "marks": 6,
            "options": []
          },
          {
            "index": "c",
            "styles": [
            "text-sm"
            ],
            "text": "Name the features of any eight devices used for input/output.",
            "marks": 8,
            "options": []
          }
          ]
        },
        {
          "index": 4,
          "styles": [
          "text-sm"
          ],
          "text": " ",
          "marks": 20,
          "options": [
          {
            "index": "a",
            "styles": [
            "text-sm"
            ],
            "text": "What are different types of optical disks ? Explain their features and give their advantages.",
            "marks": 8,
            "options": []
          },
          {
            "index": "b",
            "styles": [
            "text-sm"
            ],
            "text": "Explain at least four important features of the following application software.",
            "marks": 12,
            "options": [
            {
              "index": "i",
              "styles": [
              "text-sm"
              ],
              "text": "Word Processing",
              "marks": 0
            },
            {
              "index": "ii",
              "styles": [
              "text-sm"
              ],
              "text": "Spreadsheet",
              "marks": 0
            },
            {
              "index": "iii",
              "styles": [
              "text-sm"
              ],
              "text": "Database",
              "marks": 0
            }
            ]
          }
          ]
        },
        {
          "index": 5,
          "styles": [
          "text-sm"
          ],
          "text": "Explain any five of the following terms/phrases with the help of an example/diagram, if needed:",
          "marks": 20,
          "options": [
          {
            "index": "a",
            "styles": [
            "text-sm"
            ],
            "text": "Collaboration in the context of internet.",
            "marks": 4,
            "options": []
          },
          {
            "index": "b",
            "styles": [
            "text-sm"
            ],
            "text": "Blog in the context of internet.",
            "marks": 4,
            "options": []
          },
          {
            "index": "c",
            "styles": [
            "text-sm"
            ],
            "text": "TCP/IP",
            "marks": 4,
            "options": []
          },
          {
            "index": "d",
            "styles": [
            "text-sm"
            ],
            "text": "Router and Switches",
            "marks": 4,
            "options": []
          },
          {
            "index": "e",
            "styles": [
            "text-sm"
            ],
            "text": "User interfaces of operating systems",
            "marks": 4,
            "options": []
          },
          {
            "index": "f",
            "styles": [
            "text-sm"
            ],
            "text": "Trojan horse and spyware",
            "marks": 4,
            "options": []
          }
          ]
        }
        ]
      },
      {
        "headers": [
        {
          "courseName": "à¤¬à¥ˆà¤šà¤²à¤° à¤‘à¤« à¤•à¤‚à¤ªà¥à¤¯à¥‚à¤Ÿà¤° à¤à¤ªà¥à¤²à¥€à¤•à¥‡à¤¶à¤¨ (à¤¸à¤‚à¤¶à¥‹à¤§à¤¿à¤¤)",
          "styles": []
        },
        {
          "examinationType": "à¤¸à¤¤à¥à¤°à¤¾à¤‚à¤¤ à¤ªà¤°à¥€à¤•à¥à¤·à¤¾",
          "styles": []
        },
        {
          "semesterYear": "à¤¦à¤¿à¤¸à¤‚à¤¬à¤°, 2012",
          "styles": []
        },
        {
          "subjectName": "à¤•à¤‚à¤ªà¥à¤¯à¥‚à¤Ÿà¤° à¤®à¥‚à¤² à¤¬à¤¾à¤¤à¥‡à¤‚ à¤”à¤° à¤ªà¥€à¤¸à¥€ à¤¸à¥‰à¤«à¥à¤Ÿà¤µà¥‡à¤¯à¤°",
          "styles": []
        },
        {
          "totalMarks": 100,
          "styles": []
        },
        {
          "time": "3 à¤˜à¤‚à¤Ÿà¥‡",
          "styles": []
        },
        {
          "notes": "à¤ªà¥à¤°à¤¶à¥à¤¨ à¤¸à¤‚à¤–à¥à¤¯à¤¾ 1 à¤…à¤¨à¤¿à¤µà¤¾à¤°à¥à¤¯ à¤¹à¥ˆ à¤”à¤° à¤‡à¤¸à¤•à¥‡ 40 à¤…à¤‚à¤• à¤¹à¥ˆà¤‚à¥¤ à¤¶à¥‡à¤· à¤®à¥‡à¤‚ à¤¸à¥‡ à¤•à¤¿à¤¨à¥à¤¹à¥€à¤‚ à¤¤à¥€à¤¨ à¤ªà¥à¤°à¤¶à¥à¤¨à¥‹à¤‚ à¤•à¥‡ à¤‰à¤¤à¥à¤¤à¤° à¤¦à¥€à¤œà¤¿à¤à¥¤",
          "styles": []
        },
        {
          "subjectCode": "BCS-011",
          "styles": []
        }
        ],
        "questions": [
        {
          "index": 1,
          "styles": [
          "text-base"
          ],
          "text": " ",
          "marks": 40,
          "options": [
          {
            "index": "a",
            "styles": [
            "text-base"
            ],
            "text": "à¤¨à¤¿à¤®à¥à¤¨à¤²à¤¿à¤–à¤¿à¤¤ à¤¹à¥‡à¤•à¥à¤¸à¤¾à¤¡à¥‡à¤¸à¤¿à¤®à¤² à¤¸à¤‚à¤–à¥à¤¯à¤¾à¤“à¤‚ à¤•à¥‹ à¤¬à¤¾à¤‡à¤¨à¤°à¥€ à¤”à¤° à¤¦à¤¶à¤®à¤²à¤µ à¤¸à¤‚à¤–à¥à¤¯à¤¾à¤“à¤‚ à¤®à¥‡à¤‚ à¤¬à¤¦à¤²à¥‡à¤‚à¥¤",
            "marks": 5,
            "options": [
            {
              "index": "i",
              "styles": [
              "text-base"
              ],
              "text": "(AB)à¤¹à¥‡à¤•à¥à¤¸.",
              "marks": 0
            },
            {
              "index": "ii",
              "styles": [
              "text-base"
              ],
              "text": "(22F) à¤¹à¥‡à¤•à¥à¤¸",
              "marks": 0
            }
            ]
          },
          {
            "index": "b",
            "styles": [
            "text-base"
            ],
            "text": "à¤†à¤ª à¤šà¥à¤‚à¤¬à¤•à¥€à¤¯ à¤¡à¤¿à¤¸à¥à¤• à¤ªà¤° à¤à¤•à¥à¤¸à¥‡à¤¸ à¤¸à¤®à¤¯ à¤•à¥€ à¤—à¤£à¤¨à¤¾ à¤•à¥ˆà¤¸à¥‡ à¤•à¤°à¤¤à¥‡ à¤¹à¥ˆà¤‚? à¤à¤• à¤‰à¤ªà¤¯à¥à¤•à¥à¤¤ à¤‰à¤¦à¤¾à¤¹à¤°à¤£ à¤•à¥€ à¤¸à¤¹à¤¾à¤¯à¤¤à¤¾ à¤¸à¥‡ à¤µà¥à¤¯à¤¾à¤–à¥à¤¯à¤¾ à¤•à¤°à¥‡à¤‚à¥¤",
            "marks": 5,
            "options": []
          },
          {
            "index": "c",
            "styles": [
            "text-base"
            ],
            "text": "à¤µà¥‰à¤¨ à¤¨à¥à¤¯à¥‚à¤®à¥ˆà¤¨ à¤†à¤°à¥à¤•à¤¿à¤Ÿà¥‡à¤•à¥à¤šà¤° à¤®à¥‡à¤‚ à¤ªà¤°à¤¿à¤­à¤¾à¤·à¤¿à¤¤ à¤•à¤‚à¤ªà¥à¤¯à¥‚à¤Ÿà¤° à¤•à¥‡ à¤®à¥‚à¤² à¤˜à¤Ÿà¤• à¤•à¥à¤¯à¤¾ à¤¹à¥ˆà¤‚? à¤‡à¤¸ à¤ªà¥à¤°à¤¤à¥à¤¯à¥‡à¤• à¤˜à¤Ÿà¤• à¤•à¤¾ à¤•à¥à¤¯à¤¾ à¤‰à¤ªà¤¯à¥‹à¤— à¤¹à¥ˆ?",
            "marks": 5,
            "options": []
          },
          {
            "index": "d",
            "styles": [
            "text-base"
            ],
            "text": "à¤à¤• à¤…à¤¨à¥à¤µà¤¾à¤¦à¤• à¤ªà¥à¤°à¥‹à¤—à¥à¤°à¤¾à¤® à¤•à¥€ à¤­à¥‚à¤®à¤¿à¤•à¤¾ à¤•à¥€ à¤µà¥à¤¯à¤¾à¤–à¥à¤¯à¤¾ à¤•à¤°à¥‡à¤‚à¥¤ à¤à¤• à¤•à¤‚à¤ªà¤¾à¤‡à¤²à¤° à¤à¤• à¤…à¤¸à¥‡à¤‚à¤¬à¤²à¤° à¤¸à¥‡ à¤•à¥ˆà¤¸à¥‡ à¤­à¤¿à¤¨à¥à¤¨ à¤¹à¥ˆ?",
            "marks": 5,
            "options": []
          },
          {
            "index": "e",
            "styles": [
            "text-base"
            ],
            "text": "à¤à¤²à¥à¤—à¥‹à¤°à¤¿à¤¥à¤® à¤•à¥à¤¯à¤¾ à¤¹à¥ˆ? à¤à¤• à¤«à¥à¤²à¥‹ à¤šà¤¾à¤°à¥à¤Ÿ à¤”à¤° à¤à¤• à¤à¤²à¥à¤—à¥‹à¤°à¤¿à¤¥à¤® à¤•à¥‡ à¤¬à¥€à¤š à¤•à¥à¤¯à¤¾ à¤¸à¤‚à¤¬à¤‚à¤§ à¤¹à¥ˆ? 5 à¤…à¤²à¤—-à¤…à¤²à¤— à¤µà¤¿à¤·à¤¯à¥‹à¤‚ à¤®à¥‡à¤‚ à¤¦à¤¿à¤ à¤—à¤ à¤à¤• à¤›à¤¾à¤¤à¥à¤° à¤•à¥‡ à¤…à¤‚à¤•à¥‹à¤‚ à¤•à¤¾ à¤¯à¥‹à¤— à¤”à¤° à¤”à¤¸à¤¤ à¤œà¥à¤žà¤¾à¤¤ à¤•à¤°à¤¨à¥‡ à¤•à¥‡ à¤²à¤¿à¤ à¤à¤• à¤«à¥à¤²à¥‹à¤šà¤¾à¤°à¥à¤Ÿ à¤¬à¤¨à¤¾à¤à¤‚à¥¤ à¤…à¤‚à¤• 100 à¤®à¥‡à¤‚ à¤¸à¥‡ à¤¦à¤¿à¤ à¤—à¤ à¤¹à¥ˆà¤‚à¥¤",
            "marks": 8,
            "options": []
          },
          {
            "index": "f",
            "styles": [
            "text-base"
            ],
            "text": "à¤®à¥‹à¤¡à¥‡à¤® à¤•à¥à¤¯à¤¾ à¤¹à¥ˆ? à¤¡à¥‡à¤Ÿà¤¾ à¤Ÿà¥à¤°à¤¾à¤‚à¤¸à¤®à¤¿à¤¶à¤¨ à¤•à¥‡ à¤²à¤¿à¤ à¤‡à¤¸à¤•à¤¾ à¤‰à¤ªà¤¯à¥‹à¤— à¤•à¥ˆà¤¸à¥‡ à¤•à¤¿à¤¯à¤¾ à¤œà¤¾ à¤¸à¤•à¤¤à¤¾ à¤¹à¥ˆ? à¤à¤• à¤®à¥‹à¤¡à¥‡à¤® à¤¹à¤¬ à¤¸à¥‡ à¤•à¥ˆà¤¸à¥‡ à¤…à¤²à¤— à¤¹à¥ˆ?",
            "marks": 4,
            "options": []
          },
          {
            "index": "g",
            "styles": [
            "text-base"
            ],
            "text": "à¤¡à¥€à¤à¤¨à¤à¤¸ à¤•à¥à¤¯à¤¾ à¤¹à¥ˆ? à¤‡à¤¸à¤•à¤¾ à¤‰à¤ªà¤¯à¥‹à¤— à¤µà¥‡à¤¬ à¤ªà¤¤à¥‹à¤‚ à¤•à¥€ à¤ªà¤¹à¤šà¤¾à¤¨ à¤•à¥‡ à¤²à¤¿à¤ à¤•à¥ˆà¤¸à¥‡ à¤•à¤¿à¤¯à¤¾ à¤œà¤¾à¤¤à¤¾ à¤¹à¥ˆ? à¤à¤• à¤‰à¤¦à¤¾à¤¹à¤°à¤£ à¤•à¥€ à¤¸à¤¹à¤¾à¤¯à¤¤à¤¾ à¤¸à¥‡ à¤µà¥à¤¯à¤¾à¤–à¥à¤¯à¤¾ à¤•à¤°à¥‡à¤‚à¥¤",
            "marks": 5,
            "options": []
          },
          {
            "index": "h",
            "styles": [
            "text-base"
            ],
            "text": "à¤µà¥‡à¤¬ à¤¬à¥à¤°à¤¾à¤‰à¤œà¤¼à¤° à¤•à¥à¤¯à¤¾ à¤¹à¥ˆ? à¤‡à¤¸à¤•à¥€ à¤†à¤µà¤¶à¥à¤¯à¤•à¤¤à¤¾ à¤•à¥à¤¯à¥‹à¤‚ à¤¹à¥ˆ? à¤•à¤® à¤¸à¥‡ à¤•à¤® à¤¤à¥€à¤¨ à¤²à¥‹à¤•à¤ªà¥à¤°à¤¿à¤¯ à¤µà¥‡à¤¬ à¤¬à¥à¤°à¤¾à¤‰à¤œà¤¼à¤°à¥‹à¤‚ à¤•à¥‡ à¤¨à¤¾à¤® à¤¬à¤¤à¤¾à¤‡à¤à¥¤",
            "marks": 3,
            "options": []
          }
          ]
        },
        {
          "index": 2,
          "styles": [
          "text-base"
          ],
          "text": " ",
          "marks": 20,
          "options": [
          {
            "index": "a",
            "styles": [
            "text-base"
            ],
            "text": "à¤à¤• à¤µà¥à¤¯à¤•à¥à¤¤à¤¿à¤—à¤¤ à¤•à¤‚à¤ªà¥à¤¯à¥‚à¤Ÿà¤° à¤ªà¤° à¤‰à¤ªà¤¯à¥‹à¤— à¤•à¤¿à¤ à¤œà¤¾à¤¨à¥‡ à¤µà¤¾à¤²à¥‡ à¤•à¤¿à¤¨à¥à¤¹à¥€à¤‚ à¤šà¤¾à¤° à¤‰à¤ªà¤¯à¥‹à¤—à¤¿à¤¤à¤¾ à¤•à¤¾à¤°à¥à¤¯à¤•à¥à¤°à¤®à¥‹à¤‚ à¤•à¤¾ à¤¨à¤¾à¤® à¤”à¤° à¤‰à¤¦à¥à¤¦à¥‡à¤¶à¥à¤¯ à¤¬à¤¤à¤¾à¤à¤‚à¥¤",
            "marks": 6,
            "options": []
          },
          {
            "index": "b",
            "styles": [
            "text-base"
            ],
            "text": "à¤à¤• à¤²à¥‹à¤•à¤² à¤à¤°à¤¿à¤¯à¤¾ à¤¨à¥‡à¤Ÿà¤µà¤°à¥à¤• à¤•à¥€ à¤µà¤¿à¤¶à¥‡à¤·à¤¤à¤¾à¤à¤‚ à¤”à¤° à¤«à¤¾à¤¯à¤¦à¥‡ à¤•à¥à¤¯à¤¾ à¤¹à¥ˆà¤‚? à¤à¤• à¤†à¤°à¥‡à¤– à¤•à¥€ à¤¸à¤¹à¤¾à¤¯à¤¤à¤¾ à¤¸à¥‡ à¤•à¤¿à¤¸à¥€ à¤à¤• à¤²à¥ˆà¤¨ à¤Ÿà¥‹à¤ªà¥‹à¤²à¥‰à¤œà¥€ à¤•à¥€ à¤µà¥à¤¯à¤¾à¤–à¥à¤¯à¤¾ à¤•à¤°à¥‡à¤‚à¥¤",
            "marks": 8,
            "options": []
          },
          {
            "index": "c",
            "styles": [
            "text-base"
            ],
            "text": "\"à¤“à¤ªà¤¨ à¤¸à¥‹à¤°à¥à¤¸ à¤¸à¥‰à¤«à¥à¤Ÿà¤µà¥‡à¤¯à¤°\" à¤¶à¤¬à¥à¤¦ à¤•à¥‹ à¤ªà¤°à¤¿à¤­à¤¾à¤·à¤¿à¤¤ à¤•à¤°à¥‡à¤‚à¥¤ à¤“à¤ªà¤¨ à¤¸à¥‹à¤°à¥à¤¸ à¤¸à¥‰à¤«à¥à¤Ÿà¤µà¥‡à¤¯à¤° à¤µà¤¿à¤•à¤¾à¤¸ à¤•à¥‡ à¤²à¤¿à¤ à¤‰à¤ªà¤¯à¥‹à¤— à¤•à¤¿à¤ à¤œà¤¾à¤¨à¥‡ à¤µà¤¾à¤²à¥‡ à¤®à¥‰à¤¡à¤² à¤•à¥€ à¤•à¤¿à¤¨à¥à¤¹à¥€à¤‚ à¤¦à¥‹ à¤®à¤¹à¤¤à¥à¤µà¤ªà¥‚à¤°à¥à¤£ à¤µà¤¿à¤¶à¥‡à¤·à¤¤à¤¾à¤“à¤‚ à¤•à¥€ à¤µà¥à¤¯à¤¾à¤–à¥à¤¯à¤¾ à¤•à¤°à¥‡à¤‚à¥¤",
            "marks": 6,
            "options": []
          }
          ]
        },
        {
          "index": 3,
          "styles": [
          "text-base"
          ],
          "text": " ",
          "marks": 20,
          "options": [
          {
            "index": "a",
            "styles": [
            "text-base"
            ],
            "text": "à¤‘à¤ªà¤°à¥‡à¤Ÿà¤¿à¤‚à¤— à¤¸à¤¿à¤¸à¥à¤Ÿà¤® à¤•à¥‡ à¤¸à¤‚à¤¦à¤°à¥à¤­ à¤®à¥‡à¤‚ (i) à¤¸à¤°à¤² à¤¬à¥ˆà¤š à¤¸à¤¿à¤¸à¥à¤Ÿà¤® à¤”à¤° (ii) à¤Ÿà¤¾à¤‡à¤®-à¤¶à¥‡à¤¯à¤°à¤¿à¤‚à¤— à¤¸à¤¿à¤¸à¥à¤Ÿà¤® à¤¶à¤¬à¥à¤¦à¥‹à¤‚ à¤•à¥€ à¤µà¥à¤¯à¤¾à¤–à¥à¤¯à¤¾ à¤•à¤°à¥‡à¤‚à¥¤ à¤¬à¥ˆà¤š à¤¸à¤¿à¤¸à¥à¤Ÿà¤® à¤®à¤²à¥à¤Ÿà¥€à¤ªà¥à¤°à¥‹à¤—à¥à¤°à¤¾à¤®à¤¿à¤‚à¤— à¤¸à¤¿à¤¸à¥à¤Ÿà¤® à¤¸à¥‡ à¤•à¥ˆà¤¸à¥‡ à¤­à¤¿à¤¨à¥à¤¨ à¤¹à¥ˆà¤‚à¥¤",
            "marks": 8,
            "options": []
          },
          {
            "index": "b",
            "styles": [
            "text-base"
            ],
            "text": "à¤à¤• à¤•à¤‚à¤ªà¥à¤¯à¥‚à¤Ÿà¤° à¤¸à¤¿à¤¸à¥à¤Ÿà¤® à¤•à¤¾ à¤¹à¤¿à¤¸à¥à¤¸à¤¾ à¤¬à¤¨à¤¨à¥‡ à¤µà¤¾à¤²à¥€ à¤µà¤¿à¤­à¤¿à¤¨à¥à¤¨ à¤ªà¥à¤°à¤•à¤¾à¤° à¤•à¥€ à¤®à¥à¤–à¥à¤¯ à¤®à¥‡à¤®à¥‹à¤°à¥€ à¤•à¥€ à¤µà¥à¤¯à¤¾à¤–à¥à¤¯à¤¾ à¤•à¤°à¥‡à¤‚à¥¤ à¤ªà¤°à¥à¤¯à¤¾à¤ªà¥à¤¤ à¤ªà¥à¤°à¤¾à¤¥à¤®à¤¿à¤• à¤®à¥‡à¤®à¥‹à¤°à¥€ à¤‰à¤ªà¤²à¤¬à¥à¤§ à¤¹à¥‹à¤¨à¥‡ à¤ªà¤° à¤­à¥€ à¤†à¤ªà¤•à¥‹ à¤•à¤‚à¤ªà¥à¤¯à¥‚à¤Ÿà¤° à¤®à¥‡à¤‚ à¤¦à¥à¤µà¤¿à¤¤à¥€à¤¯à¤• à¤®à¥‡à¤®à¥‹à¤°à¥€ à¤•à¥€ à¤†à¤µà¤¶à¥à¤¯à¤•à¤¤à¤¾ à¤•à¥à¤¯à¥‹à¤‚ à¤¹à¥ˆ?",
            "marks": 6,
            "options": []
          },
          {
            "index": "c",
            "styles": [
            "text-base"
            ],
            "text": "à¤‡à¤¨à¤ªà¥à¤Ÿ/à¤†à¤‰à¤Ÿà¤ªà¥à¤Ÿ à¤•à¥‡ à¤²à¤¿à¤ à¤‰à¤ªà¤¯à¥‹à¤— à¤•à¤¿à¤ à¤œà¤¾à¤¨à¥‡ à¤µà¤¾à¤²à¥‡ à¤•à¤¿à¤¨à¥à¤¹à¥€à¤‚ à¤†à¤  à¤‰à¤ªà¤•à¤°à¤£à¥‹à¤‚ à¤•à¥€ à¤µà¤¿à¤¶à¥‡à¤·à¤¤à¤¾à¤“à¤‚ à¤•à¥‡ à¤¨à¤¾à¤® à¤¬à¤¤à¤¾à¤‡à¤à¥¤",
            "marks": 8,
            "options": []
          }
          ]
        },
        {
          "index": 4,
          "styles": [
          "text-base"
          ],
          "text": " ",
          "marks": 20,
          "options": [
          {
            "index": "a",
            "styles": [
            "text-base"
            ],
            "text": "à¤µà¤¿à¤­à¤¿à¤¨à¥à¤¨ à¤ªà¥à¤°à¤•à¤¾à¤° à¤•à¥€ à¤‘à¤ªà¥à¤Ÿà¤¿à¤•à¤² à¤¡à¤¿à¤¸à¥à¤• à¤•à¥Œà¤¨ à¤¸à¥€ à¤¹à¥ˆà¤‚? à¤‰à¤¨à¤•à¥€ à¤µà¤¿à¤¶à¥‡à¤·à¤¤à¤¾à¤“à¤‚ à¤•à¥€ à¤µà¥à¤¯à¤¾à¤–à¥à¤¯à¤¾ à¤•à¤°à¥‡à¤‚ à¤”à¤° à¤‰à¤¨à¤•à¥‡ à¤«à¤¾à¤¯à¤¦à¥‡ à¤¬à¤¤à¤¾à¤à¤‚à¥¤",
            "marks": 8,
            "options": []
          },
          {
            "index": "b",
            "styles": [
            "text-base"
            ],
            "text": "à¤¨à¤¿à¤®à¥à¤¨à¤²à¤¿à¤–à¤¿à¤¤ à¤à¤ªà¥à¤²à¤¿à¤•à¥‡à¤¶à¤¨ à¤¸à¥‰à¤«à¥à¤Ÿà¤µà¥‡à¤¯à¤° à¤•à¥€ à¤•à¤® à¤¸à¥‡ à¤•à¤® à¤šà¤¾à¤° à¤®à¤¹à¤¤à¥à¤µà¤ªà¥‚à¤°à¥à¤£ à¤µà¤¿à¤¶à¥‡à¤·à¤¤à¤¾à¤“à¤‚ à¤•à¥€ à¤µà¥à¤¯à¤¾à¤–à¥à¤¯à¤¾ à¤•à¤°à¥‡à¤‚à¥¤",
            "marks": 12,
            "options": [
            {
              "index": "i",
              "styles": [
              "text-base"
              ],
          {
            "index": "a",
            "styles": [
            "text-base"
            ],
            "text": "à¤‡à¤‚à¤Ÿà¤°à¤¨à¥‡à¤Ÿ à¤•à¥‡ à¤¸à¤‚à¤¦à¤°à¥à¤­ à¤®à¥‡à¤‚ à¤¸à¤¹à¤¯à¥‹à¤—à¥¤",
            "marks": 4,
            "options": []
          },
          {
            "index": "b",
            "styles": [
            "text-base"
            ],
            "text": "à¤‡à¤‚à¤Ÿà¤°à¤¨à¥‡à¤Ÿ à¤•à¥‡ à¤¸à¤‚à¤¦à¤°à¥à¤­ à¤®à¥‡à¤‚ à¤¬à¥à¤²à¥‰à¤—à¥¤",
            "marks": 4,
            "options": []
          },
          {
            "index": "c",
            "styles": [
            "text-base"
            ],
            "text": "à¤Ÿà¥€à¤¸à¥€à¤ªà¥€/à¤†à¤ˆà¤ªà¥€",
            "marks": 4,
            "options": []
          },
          {
            "index": "d",
            "styles": [
            "text-base"
            ],
            "text": "à¤°à¤¾à¤‰à¤Ÿà¤° à¤”à¤° à¤¸à¥à¤µà¤¿à¤š",
            "marks": 4,
            "options": []
          },
          {
            "index": "e",
            "styles": [
            "text-base"
            ],
            "text": "à¤‘à¤ªà¤°à¥‡à¤Ÿà¤¿à¤‚à¤— à¤¸à¤¿à¤¸à¥à¤Ÿà¤® à¤•à¥‡ à¤¯à¥‚à¤œà¤° à¤‡à¤‚à¤Ÿà¤°à¤«à¥‡à¤¸",
            "marks": 4,
            "options": []
          },
          {
            "index": "f",
            "styles": [
            "text-base"
            ],
            "text": "à¤Ÿà¥à¤°à¥‹à¤œà¤¨ à¤¹à¥‰à¤°à¥à¤¸ à¤”à¤° à¤¸à¥à¤ªà¤¾à¤‡à¤µà¥‡à¤¯à¤°",
            "marks": 4,
            "options": []
          }
          ]
        }
        ]
      }
      ],
      "createdAt": {
      do not change this
      "$date": "2025-08-28T00:03:21.629Z"
      },
      "updatedAt": {
      "$date": "2025-08-28T18:42:10.033Z"
      },
      "__v": 0
    }
    }
    Current question paper data: ${JSON.stringify(typeof questionPaperForUser === 'string' ? JSON.parse(questionPaperForUser) : questionPaperForUser)}`
            }
          ]
        },
        {
          role: "user",
          parts: [{ text: prompt }]
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
          required: ["answer"]
        }
      }
    });

    const json = JSON.parse(result.response.text());
    

    // Convert questionPaperForUser to object if it's a string
    if (typeof json.questionPaperForUser === 'string') {
      json.questionPaperForUser = JSON.parse(json.questionPaperForUser);
    }

    return NextResponse.json(json);


  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


