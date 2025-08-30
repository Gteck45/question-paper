# Enhanced Question Paper Generation API

The API now supports multiple ways to generate question papers:

## API Endpoint
`POST /api/generateai`

## Usage Examples

### 1. Basic Question Paper Generation (Just Subject + Marks)
```javascript
// JSON Request
const response = await fetch('/api/generateai', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    subject: "Mathematics",
    marks: 100
  })
});
```

### 2. With Custom Prompt
```javascript
// JSON Request with prompt
const response = await fetch('/api/generateai', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: "Create a question paper for advanced calculus covering integration and differentiation",
    subject: "Mathematics",
    marks: 100
  })
});
```

### 3. File Upload + Subject Generation
```javascript
// Form Data with file upload
const formData = new FormData();
formData.append('subject', 'Computer Science');
formData.append('marks', '100');
formData.append('file', fileInput.files[0]); // User uploaded file
formData.append('prompt', 'Generate questions based on the uploaded content');

const response = await fetch('/api/generateai', {
  method: 'POST',
  body: formData
});
```

### 4. Enhance Existing Question Paper
```javascript
// JSON Request to modify existing paper
const existingQuestionPaper = {
  // ... existing question paper structure
};

const response = await fetch('/api/generateai', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: "Add more difficult questions to this paper",
    questionPaperForUser: existingQuestionPaper,
    subject: "Physics",
    marks: 100
  })
});
```

## Request Parameters

### For JSON Requests:
- `prompt` (string, optional): Custom instructions for question generation
- `subject` (string, optional): Subject name for the question paper
- `marks` (number, optional): Total marks for the paper (default: 100)
- `questionPaperForUser` (object, optional): Existing question paper to enhance/modify

### For Form Data Requests (File Upload):
- `prompt` (string, optional): Custom instructions for question generation
- `subject` (string, optional): Subject name for the question paper
- `marks` (number, optional): Total marks for the paper (default: 100)
- `questionPaperForUser` (string, optional): JSON string of existing question paper
- `file` (file, optional): File containing additional content for question generation

## Response Format
```json
{
  "answer": "Description of what was generated",
  "questionPaperForUser": {
    "_id": { "$oid": "generated_id" },
    "userId": { "$oid": "user_id" },
    "content": [
      {
        "headers": [
          { "courseName": "Course Name", "styles": [] },
          { "examinationType": "Examination", "styles": [] },
          { "semesterYear": "2025", "styles": [] },
          { "subjectName": "Subject", "styles": [] },
          { "totalMarks": 100, "styles": [] },
          { "time": "3 hours", "styles": [] },
          { "notes": "Instructions", "styles": [] },
          { "subjectCode": "CODE", "styles": [] }
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
      }
    ],
    "createdAt": { "$date": "2025-08-30T..." },
    "updatedAt": { "$date": "2025-08-30T..." },
    "__v": 0
  }
}
```

## Features

1. **Flexible Input**: Works with or without existing question paper structure
2. **File Upload Support**: Can process uploaded files for content-based question generation
3. **Auto-generation**: Can create complete question papers from just subject and marks
4. **Enhancement**: Can modify and improve existing question papers
5. **Backward Compatibility**: All existing functionality is preserved

## Error Handling

The API returns appropriate error messages for:
- Missing API key
- Invalid input parameters
- File processing errors
- AI generation failures

## Notes

- If only `subject` is provided, a basic question paper template is automatically created
- File content is used to generate relevant questions when uploaded
- The API maintains the exact JSON structure required by your application
- All existing functionality remains intact
