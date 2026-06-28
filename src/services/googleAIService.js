// src/services/googleAIService.js
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_API_KEY);

// gemini-1.5-pro: Best for complex tasks, vision, and reasoning
// gemini-1.5-flash: Faster, cheaper, good for simple tasks
// gemini-1.0-pro: Older model, still works well
const MODEL_NAME = "gemini-1.5-pro-latest";

// Initialize the model
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

// For vision tasks (images)
const visionModel = genAI.getGenerativeModel({
  model: "gemini-1.5-pro-latest",
  generationConfig: {
    temperature: 0.1, 
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
  },
});

/**
 * Convert file to base64 for Gemini Vision
 */
const fileToGenerativePart = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result.split(",")[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Extract answers from an image using Gemini Vision
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
          { "questionNumber": 2, "answer": "B" },
          ...
        ],
        "totalQuestions": 10,
        "confidence": 0.95
      }
      
      Only return valid JSON, nothing else.
    `;

    const result = await visionModel.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    try {
      // Find JSON in the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(text);
    } catch {
      console.error("Failed to parse Gemini response:", text);
    }
  } catch (error) {
    console.error("Error extracting answers from image:", error);
    throw error;
  }
};

/**
 * Compare answer key with student answers using Gemini
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
      
      Image 1: Answer Key (correct answers)
      Image 2: Student's Answer Sheet
      
      Analyze both images and:
      1. Extract all answers from the answer key
      2. Extract all answers from the student's sheet
      3. Compare them question by question
      4. Calculate the score
      
      Return the results in the following JSON format:
      {
        "score": 85, // Percentage score
        "correct": 8, // Number of correct answers
        "total": 10, // Total number of questions
        "confidence": 0.95, // Confidence in the extraction
        "details": [
          {
            "questionNumber": 1,
            "correctAnswer": "A",
            "studentAnswer": "A",
            "isCorrect": true
          },
          // ... more questions
        ],
        "summary": "Overall performance summary"
      }
      
      Only return valid JSON, nothing else.
    `;

    const result = await visionModel.generateContent([
      prompt,
      answerKeyPart,
      studentSheetPart,
    ]);

    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(text);
    } catch {
      console.error("Failed to parse Gemini response:", text);
    }
  } catch (error) {
    console.error("Error comparing answers with Gemini:", error);
    throw error;
  }
};

/**
 * Generate feedback for a student's performance
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
      
      Keep it professional and constructive.
      Return the feedback as a JSON object:
      {
        "overall": "string",
        "strengths": ["string", ...],
        "weaknesses": ["string", ...],
        "recommendations": ["string", ...],
        "encouragement": "string"
      }
      
      Only return valid JSON, nothing else.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating feedback:", error);
    throw error;
  }
};

/**
 * Analyze class performance trends
 */
export const analyzeClassPerformance = async (classData) => {
  try {
    const prompt = `
      Analyze the following class performance data and provide insights:
      
      ${JSON.stringify(classData, null, 2)}
      
      Provide:
      1. Overall class performance summary
      2. Top performing students
      3. Students who need help
      4. Quiz difficulty analysis
      5. Recommendations for improving class performance
      6. Trends (improving, declining, stable)
      
      Return the analysis as a JSON object:
      {
        "summary": "string",
        "topPerformers": [{"name": "string", "score": 0}, ...],
        "studentsNeedingHelp": [{"name": "string", "score": 0}, ...],
        "quizDifficulty": {"easy": [], "medium": [], "hard": []},
        "recommendations": ["string", ...],
        "trend": "improving|declining|stable",
        "trendDetails": "string"
      }
      
      Only return valid JSON, nothing else.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (error) {
    console.error("Error analyzing class performance:", error);
    throw error;
  }
};

/**
 * Generate a quiz from a topic
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
      
      Create a variety of question types (multiple choice, true/false, short answer).
      Each question should have 4 options (A, B, C, D).
      Include the correct answer and a brief explanation for each question.
      
      Return the quiz in the following JSON format:
      {
        "title": "Quiz title",
        "description": "Brief description of the quiz",
        "questions": [
          {
            "number": 1,
            "type": "multiple-choice",
            "question": "Question text",
            "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
            "correctAnswer": "A",
            "explanation": "Why this is the correct answer"
          }
        ]
      }
      
      Only return valid JSON, nothing else.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
};

/**
 * Analyze quiz results and generate insights
 */
export const analyzeQuizResults = async (quizData) => {
  try {
    const prompt = `
      You are an AI assistant that analyzes quiz results and provides insights for teachers.
      
      Here is the quiz data:
      ${JSON.stringify(quizData, null, 2)}
      
      Analyze this data and provide:
      1. Overall quiz performance summary
      2. Which questions students struggled with most (list question numbers and topics)
      3. Which questions students performed well on
      4. Percentage of students who passed (score >= 70%)
      5. Percentage of students who failed (score < 70%)
      6. Average score
      7. Score distribution (how many students in each grade range: A, B, C, D, F)
      8. Key insights and recommendations for the teacher
      
      Return the analysis as a JSON object with this exact structure:
      {
        "summary": "Overall summary paragraph",
        "totalStudents": number,
        "averageScore": number,
        "passRate": number, // percentage
        "failRate": number, // percentage
        "gradeDistribution": {
          "A": number, // 90-100%
          "B": number, // 80-89%
          "C": number, // 70-79%
          "D": number, // 60-69%
          "F": number  // below 60%
        },
        "mostDifficultQuestions": [
          {
            "questionNumber": number,
            "correctAnswer": string,
            "studentAnswers": {
              "A": number,
              "B": number,
              "C": number,
              "D": number
            },
            "percentCorrect": number,
            "commonWrongAnswer": string,
            "insight": "Why students might have struggled with this question"
          }
        ],
        "easiestQuestions": [
          {
            "questionNumber": number,
            "percentCorrect": number
          }
        ],
        "recommendations": [
          "Recommendation 1",
          "Recommendation 2"
        ],
        "insights": [
          "Insight 1",
          "Insight 2"
        ]
      }
      
      Only return valid JSON, nothing else.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(text);
    } catch {
      console.error("Failed to parse Gemini response:", text);
    }
  } catch (error) {
    console.error("Error analyzing quiz results:", error);
    // Return null instead of throwing to allow fallback
    return null;
  }
};

// Update the export at the bottom
export default {
  extractAnswersFromImage,
  compareAnswersWithGemini,
  generateStudentFeedback,
  analyzeClassPerformance,
  generateQuizFromTopic,
  analyzeQuizResults,
};