// Test script for API error handling
const testErrorHandling = async () => {
  const baseUrl = 'http://localhost:3000'; // Adjust if your server runs on a different port
  
  console.log('Testing API error handling...\n');
  
  try {
    // Test 1: Valid request (should work if API key is valid)
    console.log('Test 1: Valid request');
    const response1 = await fetch(`${baseUrl}/api/generateai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Create a simple math question',
        questionPaperForUser: {
          content: [{
            headers: [
              { courseName: "Test Course", styles: [] },
              { examinationType: "Test Exam", styles: [] },
              { semesterYear: "2025", styles: [] },
              { subjectName: "Mathematics", styles: [] },
              { totalMarks: 100, styles: [] },
              { time: "3 hours", styles: [] },
              { notes: "Answer all questions", styles: [] },
              { subjectCode: "MATH101", styles: [] }
            ],
            questions: []
          }]
        }
      })
    });
    
    console.log(`Status: ${response1.status}`);
    const result1 = await response1.json();
    console.log(`Response:`, result1.error || 'Success');
    
    // Check for retry-after header
    const retryAfter = response1.headers.get('Retry-After');
    if (retryAfter) {
      console.log(`Retry-After header: ${retryAfter} seconds`);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
  
  console.log('\n--- Test completed ---');
  console.log('The improved error handling includes:');
  console.log('• Retry logic with exponential backoff (3 attempts)');
  console.log('• Circuit breaker pattern (opens after 3 failures)');
  console.log('• Specific error messages for different failure types');
  console.log('• Retry-After headers for rate limiting');
  console.log('• Better 503 Service Unavailable handling');
};

// Export for use in development
if (typeof module !== 'undefined' && module.exports) {
  module.exports = testErrorHandling;
} else {
  // Run directly if in browser or Node.js
  testErrorHandling();
}
