// src/services/googleAIService.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_API_KEY);

const MODEL_NAME = "gemini-1.5-flash"; // free tier

const model = genAI.getGenerativeModel({ model: MODEL_NAME });

// Vision model — same free-tier flash model, tuned for accuracy over speed
const visionModel = genAI.getGenerativeModel({
  model: MODEL_NAME,
  generationConfig: {
    temperature: 0.1,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
  },
});

/**
 * Convert a File to the inlineData part Gemini expects.
 */
const fileToGenerativePart = async (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () =>
      resolve({
        inlineData: {
          data: reader.result.split(",")[1],
          mimeType: file.type,
        },
      });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/**
 * Extract answers from a single image.
 */
export const extractAnswersFromImage = async (imageFile) => {
  try {
    const imagePart = await fileToGenerativePart(imageFile);

    const prompt = `
You are an AI assistant that extracts answers from quiz/test images.

Analyze the image and extract all the answers. Look for patterns like:
- Numbered questions (1., 2., 3., etc.)
- Letters (A, B, C, D) or answers
- The answer could be marked with circles, checkmarks, or written text

Return the answers in the following JSON format:
{
  "answers": [
    { "questionNumber": 1, "answer": "A" },
    { "questionNumber": 2, "answer": "B" }
  ],
  "totalQuestions": 10,
  "confidence": 0.95
}

Only return valid JSON, nothing else.
    `;

    const result = await visionModel.generateContent([prompt, imagePart]);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
  } catch (error) {
    console.error("Error extracting answers from image:", error);
    throw error;
  }
};

/**
 * Compare answer key image with student sheet image.
 * Returns { score, correct, total, confidence, details, summary }.
 */
export const compareAnswersWithGemini = async (
  answerKeyImage,
  studentSheetImage,
) => {
  try {
    const answerKeyPart = await fileToGenerativePart(answerKeyImage);
    const studentSheetPart = await fileToGenerativePart(studentSheetImage);

    const prompt = `
You are an AI assistant that compares answer keys with student answer sheets.

Image 1 is the ANSWER KEY (correct answers).
Image 2 is the STUDENT'S ANSWER SHEET.

Instructions:
- Read EVERY question number visible in the answer key.
- For each question, find the student's written answer in the student sheet.
- If the student left a question blank or you cannot read their answer, set studentAnswer to null.
- Compare each answer exactly and mark isCorrect accordingly.
- Calculate the final percentage score.

Return ONLY valid JSON in this exact format, no extra text:
{
  "score": 85,
  "correct": 17,
  "total": 20,
  "confidence": 0.95,
  "details": [
    { "questionNumber": 1, "correctAnswer": "A", "studentAnswer": "A", "isCorrect": true },
    { "questionNumber": 2, "correctAnswer": "C", "studentAnswer": "B", "isCorrect": false },
    { "questionNumber": 3, "correctAnswer": "D", "studentAnswer": null, "isCorrect": false }
  ],
  "summary": "The student scored 85% (17/20 correct)."
}
    `;

    const result = await visionModel.generateContent([
      prompt,
      answerKeyPart,
      studentSheetPart,
    ]);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
  } catch (error) {
    console.error("Error comparing answers with Gemini:", error);
    throw error;
  }
};

/**
 * Generate feedback for a student's performance.
 */
export const generateStudentFeedback = async (
  studentName,
  score,
  quizTitle,
  details,
) => {
  try {
    const prompt = `
Generate personalized feedback for a student based on their quiz performance.

Student: ${studentName}
Quiz: ${quizTitle}
Score: ${score}%

Question details:
${JSON.stringify(details, null, 2)}

Provide:
1. Overall performance assessment
2. Strengths (topics they did well on)
3. Areas for improvement (topics they struggled with)
4. Specific recommendations for improvement
5. Encouraging message

Return ONLY valid JSON:
{
  "overall": "string",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "recommendations": ["string"],
  "encouragement": "string"
}
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
  } catch (error) {
    console.error("Error generating feedback:", error);
    throw error;
  }
};

/**
 * Analyze class performance trends.
 */
export const analyzeClassPerformance = async (classData) => {
  try {
    const prompt = `
Analyze the following class performance data and provide insights:

${JSON.stringify(classData, null, 2)}

Return ONLY valid JSON:
{
  "summary": "string",
  "topPerformers": [{"name": "string", "score": 0}],
  "studentsNeedingHelp": [{"name": "string", "score": 0}],
  "quizDifficulty": {"easy": [], "medium": [], "hard": []},
  "recommendations": ["string"],
  "trend": "improving|declining|stable",
  "trendDetails": "string"
}
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
  } catch (error) {
    console.error("Error analyzing class performance:", error);
    throw error;
  }
};

/**
 * Generate a quiz from a topic.
 */
export const generateQuizFromTopic = async (
  topic,
  numQuestions = 10,
  difficulty = "medium",
) => {
  try {
    const prompt = `
Generate a quiz on the topic: "${topic}"

Difficulty: ${difficulty}
Number of questions: ${numQuestions}

Return ONLY valid JSON:
{
  "title": "Quiz title",
  "description": "Brief description",
  "questions": [
    {
      "number": 1,
      "type": "multiple-choice",
      "question": "Question text",
      "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
      "correctAnswer": "A",
      "explanation": "Why this is correct"
    }
  ]
}
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
};

/**
 * Analyze quiz results and generate insights.
 */
export const analyzeQuizResults = async (quizData) => {
  try {
    const prompt = `
You are an AI assistant that analyzes quiz results and provides insights for teachers.

Here is the quiz data:
${JSON.stringify(quizData, null, 2)}

Return ONLY valid JSON:
{
  "summary": "string",
  "totalStudents": 0,
  "averageScore": 0,
  "passRate": 0,
  "failRate": 0,
  "gradeDistribution": { "A": 0, "B": 0, "C": 0, "D": 0, "F": 0 },
  "mostDifficultQuestions": [
    {
      "questionNumber": 0,
      "correctAnswer": "string",
      "studentAnswers": { "A": 0, "B": 0, "C": 0, "D": 0 },
      "percentCorrect": 0,
      "commonWrongAnswer": "string",
      "insight": "string"
    }
  ],
  "easiestQuestions": [{ "questionNumber": 0, "percentCorrect": 0 }],
  "recommendations": ["string"],
  "insights": ["string"]
}
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
  } catch (error) {
    console.error("Error analyzing quiz results:", error);
    return null;
  }
};

export default {
  extractAnswersFromImage,
  compareAnswersWithGemini,
  generateStudentFeedback,
  analyzeClassPerformance,
  generateQuizFromTopic,
  analyzeQuizResults,
};
