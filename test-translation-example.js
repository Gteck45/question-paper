// Test script to demonstrate header and question translation
const testTranslationExample = () => {
  console.log('='.repeat(60));
  console.log('TRANSLATION TEST: Headers AND Questions');
  console.log('='.repeat(60));

  // Example original English document
  const originalDocument = {
    headers: [
      { courseName: "Computer Science", styles: ["text-lg", "font-bold"] },
      { examinationType: "Final Examination", styles: ["text-base", "font-bold"] },
      { semesterYear: "First Year - Second Semester", styles: ["text-sm"] },
      { subjectName: "Data Structures and Algorithms", styles: ["text-base"] },
      { totalMarks: 100, styles: ["text-sm"] },
      { time: "3 hours", styles: ["text-sm"] },
      { notes: "Answer all questions. Each question carries equal marks.", styles: ["text-xs"] },
      { subjectCode: "CS-201", styles: ["text-xs"] }
    ],
    questions: [
      {
        index: 1,
        styles: [],
        text: "What is a data structure? Explain the difference between arrays and linked lists.",
        marks: 10,
        options: [
          {
            index: "a",
            styles: [],
            text: "Define data structure",
            marks: 5
          },
          {
            index: "b", 
            styles: [],
            text: "Compare arrays and linked lists",
            marks: 5
          }
        ]
      },
      {
        index: 2,
        styles: [],
        text: "Implement a binary search algorithm and analyze its time complexity.",
        marks: 15,
        options: []
      }
    ]
  };

  // Expected French translation
  const expectedFrenchTranslation = {
    headers: [
      { courseName: "Informatique", styles: ["text-lg", "font-bold"] },
      { examinationType: "Examen Final", styles: ["text-base", "font-bold"] },
      { semesterYear: "Première Année - Deuxième Semestre", styles: ["text-sm"] },
      { subjectName: "Structures de Données et Algorithmes", styles: ["text-base"] },
      { totalMarks: 100, styles: ["text-sm"] }, // Number unchanged
      { time: "3 heures", styles: ["text-sm"] },
      { notes: "Répondez à toutes les questions. Chaque question porte des points égaux.", styles: ["text-xs"] },
      { subjectCode: "CS-201", styles: ["text-xs"] } // Code unchanged
    ],
    questions: [
      {
        index: 1, // Number unchanged
        styles: [],
        text: "Qu'est-ce qu'une structure de données ? Expliquez la différence entre les tableaux et les listes chaînées.",
        marks: 10, // Number unchanged
        options: [
          {
            index: "a", // Letter unchanged
            styles: [],
            text: "Définir la structure de données",
            marks: 5 // Number unchanged
          },
          {
            index: "b", // Letter unchanged
            styles: [],
            text: "Comparer les tableaux et les listes chaînées",
            marks: 5 // Number unchanged
          }
        ]
      },
      {
        index: 2, // Number unchanged
        styles: [],
        text: "Implémentez un algorithme de recherche binaire et analysez sa complexité temporelle.",
        marks: 15, // Number unchanged
        options: []
      }
    ]
  };

  console.log('\n📋 ORIGINAL ENGLISH DOCUMENT:');
  console.log('Headers:');
  originalDocument.headers.forEach((header, i) => {
    const key = Object.keys(header).find(k => k !== 'styles');
    console.log(`  ${i + 1}. ${key}: "${header[key]}"`);
  });

  console.log('\nQuestions:');
  originalDocument.questions.forEach((question, i) => {
    console.log(`  ${question.index}. "${question.text}" (${question.marks} marks)`);
    question.options.forEach(option => {
      console.log(`     ${option.index}) "${option.text}" (${option.marks} marks)`);
    });
  });

  console.log('\n🇫🇷 EXPECTED FRENCH TRANSLATION:');
  console.log('Headers:');
  expectedFrenchTranslation.headers.forEach((header, i) => {
    const key = Object.keys(header).find(k => k !== 'styles');
    console.log(`  ${i + 1}. ${key}: "${header[key]}"`);
  });

  console.log('\nQuestions:');
  expectedFrenchTranslation.questions.forEach((question, i) => {
    console.log(`  ${question.index}. "${question.text}" (${question.marks} marks)`);
    question.options.forEach(option => {
      console.log(`     ${option.index}) "${option.text}" (${option.marks} marks)`);
    });
  });

  console.log('\n✅ TRANSLATION RULES APPLIED:');
  console.log('✓ Headers translated: courseName, examinationType, semesterYear, subjectName, time, notes');
  console.log('✓ Questions translated: All question text and option text');
  console.log('✓ Preserved: indexes (1, 2, a, b), marks (numbers), styles, totalMarks, subjectCode');
  console.log('✓ Structure maintained: Same object structure and field names');

  console.log('\n🚨 IMPORTANT NOTES:');
  console.log('• Headers are equally important as questions for user understanding');
  console.log('• Course names, exam types, and instructions must be in target language');
  console.log('• Time descriptions ("3 hours" → "3 heures") should be translated');
  console.log('• Technical codes (CS-201) usually remain unchanged');
  console.log('• Numbers for marks and indexes stay the same across languages');

  console.log('\n' + '='.repeat(60));
};

// Export for use in development
if (typeof module !== 'undefined' && module.exports) {
  module.exports = testTranslationExample;
} else {
  // Run directly if in browser or Node.js
  testTranslationExample();
}
