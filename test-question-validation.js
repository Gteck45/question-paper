// Test script for question structure validation
const testQuestionValidation = () => {
  console.log('Testing question structure validation...\n');

  // Sample question structures to test
  const testCases = [
    {
      name: "Missing index field",
      question: {
        styles: [],
        text: "What is JavaScript?",
        marks: 5,
        options: []
      },
      expectedFix: "Should add index: 1"
    },
    {
      name: "Missing styles field", 
      question: {
        index: 1,
        text: "What is Node.js?",
        marks: 5,
        options: []
      },
      expectedFix: "Should add styles: []"
    },
    {
      name: "Missing options field",
      question: {
        index: 1,
        styles: [],
        text: "Explain React",
        marks: 10
      },
      expectedFix: "Should add options: []"
    },
    {
      name: "Options with missing index",
      question: {
        index: 1,
        styles: [],
        text: "Select the correct answer:",
        marks: 4,
        options: [
          {
            styles: [],
            text: "Option 1",
            marks: 1
          },
          {
            styles: [],
            text: "Option 2", 
            marks: 1
          }
        ]
      },
      expectedFix: "Should add index 'a', 'b' to options"
    },
    {
      name: "Complete valid question",
      question: {
        index: 1,
        styles: [],
        text: "What is the purpose of useState hook?",
        marks: 5,
        options: [
          {
            index: "a",
            styles: [],
            text: "State management",
            marks: 2
          },
          {
            index: "b", 
            styles: [],
            text: "Side effects",
            marks: 2
          }
        ]
      },
      expectedFix: "Should remain unchanged"
    }
  ];

  // Simulate the validation function from our API
  const validateAndFixQuestion = (question, questionIndex) => {
    const fixed = { ...question };
    let changes = [];

    // Fix missing index
    if (typeof fixed.index === 'undefined') {
      fixed.index = questionIndex + 1;
      changes.push(`Added index: ${fixed.index}`);
    }

    // Fix missing styles
    if (!fixed.styles) {
      fixed.styles = [];
      changes.push('Added styles: []');
    }

    // Fix missing text
    if (typeof fixed.text !== 'string') {
      fixed.text = fixed.text ? String(fixed.text) : "";
      changes.push('Fixed text field');
    }

    // Fix missing marks
    if (typeof fixed.marks !== 'number') {
      fixed.marks = parseInt(fixed.marks) || 0;
      changes.push('Fixed marks field');
    }

    // Fix missing options
    if (!fixed.options || !Array.isArray(fixed.options)) {
      fixed.options = [];
      changes.push('Added options: []');
    }

    // Fix options
    fixed.options.forEach((option, optionIndex) => {
      if (typeof option.index === 'undefined') {
        option.index = String.fromCharCode(97 + optionIndex); // 97 is 'a' in ASCII
        changes.push(`Added option index: ${option.index}`);
      }

      if (!option.styles) {
        option.styles = [];
        changes.push(`Added styles to option ${option.index}`);
      }

      if (typeof option.text !== 'string') {
        option.text = option.text ? String(option.text) : "";
        changes.push(`Fixed text for option ${option.index}`);
      }

      if (typeof option.marks !== 'number') {
        option.marks = parseInt(option.marks) || 0;
        changes.push(`Fixed marks for option ${option.index}`);
      }
    });

    return { fixed, changes };
  };

  // Run tests
  testCases.forEach((testCase, index) => {
    console.log(`\n${index + 1}. ${testCase.name}`);
    console.log('Original:', JSON.stringify(testCase.question, null, 2));
    
    const result = validateAndFixQuestion(testCase.question, 0);
    
    console.log('Changes made:', result.changes.length > 0 ? result.changes.join(', ') : 'None');
    console.log('Expected:', testCase.expectedFix);
    
    // Check if the fixed question has all required fields
    const hasRequiredFields = 
      typeof result.fixed.index === 'number' &&
      Array.isArray(result.fixed.styles) &&
      typeof result.fixed.text === 'string' &&
      typeof result.fixed.marks === 'number' &&
      Array.isArray(result.fixed.options);
    
    console.log('✅ Validation passed:', hasRequiredFields);
    
    if (result.fixed.options.length > 0) {
      const optionsValid = result.fixed.options.every(option =>
        typeof option.index === 'string' &&
        Array.isArray(option.styles) &&
        typeof option.text === 'string' &&
        typeof option.marks === 'number'
      );
      console.log('✅ Options validation passed:', optionsValid);
    }
  });

  console.log('\n--- Test Summary ---');
  console.log('The validation function will now:');
  console.log('• Automatically add missing "index" fields to questions');
  console.log('• Ensure all required fields (styles, text, marks, options) exist');
  console.log('• Fix sub-question indexes (a, b, c, etc.)');
  console.log('• Convert invalid field types to correct types');
  console.log('• This should resolve the "Document 1, question 1 must have an index" error');
};

// Export for use in development
if (typeof module !== 'undefined' && module.exports) {
  module.exports = testQuestionValidation;
} else {
  // Run directly if in browser or Node.js
  testQuestionValidation();
}
