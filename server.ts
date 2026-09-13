import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { 
  getOfflineQuizFallback, 
  getOfflineEvaluationFallback, 
  getOfflineReminderFallback 
} from "./src/lib/quizFallbacks";

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

/**
 * Robust helper to call Gemini models with a lightweight fallback if the primary model is busy or unavailable.
 */
async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
}) {
  try {
    return await ai.models.generateContent({
      model: "gemini-3.5-flash",
      ...params
    });
  } catch (error: any) {
    console.warn("Primary model gemini-3.5-flash failed or experienced high demand. Falling back to gemini-3.1-flash-lite. Error:", error.message || error);
    try {
      return await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        ...params
      });
    } catch (fallbackError: any) {
      console.warn("Fallback model gemini-3.1-flash-lite also failed. Error:", fallbackError.message || fallbackError);
      throw fallbackError;
    }
  }
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

/**
 * Generate questions using Gemini-3.5-flash
 */
app.post("/api/generate-exercise", async (req, res) => {
  try {
    const { topic, difficulty, weakAreas, displayName, earnedBadges, fieldOfStudy } = req.body;

    const subtopicContext = weakAreas && weakAreas.length > 0 
      ? `Focus particularly on these weak subtopics: ${weakAreas.join(", ")}.`
      : "Provide a comprehensive set of questions covering key concepts of this topic.";

    const fieldOfStudyContext = fieldOfStudy 
      ? `The student's primary academic focus/need is in the field of: "${fieldOfStudy}". Wherever applicable, frame the question scenarios, explanations, or practical analogies using examples relevant to "${fieldOfStudy}" (e.g., biological/clinical examples for Medical, business/financial/management examples for Commerce, structural/software/physical systems examples for Engineering/Technology).`
      : "";

    const prompt = `
      You are an expert AI Adaptive Tutor for TutorCloud.
      Generate 5 unique, high-quality assessment questions for student ${displayName || 'Student'} on the topic: "${topic}".
      The difficulty level of the questions must be: "${difficulty || 'Intermediate'}".
      
      Requirements:
      1. Include exactly 3 MCQs (Multiple Choice Questions), 1 fill-in-the-blank question, and 1 short-answer question.
      2. ${subtopicContext}
      3. ${fieldOfStudyContext}
      4. For MCQs, provide exactly 4 options.
      5. For fill-in-the-blank, the correctAnswer should be the specific term or phrase to be typed in.
      6. For short-answer, the correctAnswer should contain the ideal, concise answer.
      7. Provide a helpful, conceptual 'hint' for each question. Mention the student's motivation if they have badges like ${earnedBadges?.join(", ") || "none"}.
      8. Provide a detailed, easy-to-understand 'explanation' explaining WHY the correctAnswer is right and why others are wrong.
      9. Write a custom, warm, and hyper-personalized 'aiMotivation' paragraph. Address them by ${displayName || 'Scholar'}, acknowledge their current "${difficulty}" challenge, and encourage them to do their best. Keep it short and engaging (under 3 sentences).
    `;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        questions: {
          type: Type.ARRAY,
          description: "List of exactly 5 adaptive questions",
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "A unique random string ID e.g., 'q_1', 'q_2'" },
              type: { type: Type.STRING, description: "Must be exactly 'mcq', 'fill_blank', or 'short_answer'" },
              question: { type: Type.STRING, description: "The question text, formatted clearly" },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Provide exactly 4 answer options for MCQ. Empty array for fill_blank and short_answer."
              },
              correctAnswer: { type: Type.STRING, description: "The correct value (must match one of the options for MCQ)" },
              explanation: { type: Type.STRING, description: "Clear, encouraging explanation of the correct answer" },
              hint: { type: Type.STRING, description: "A subtle, helpful guide without giving the answer away" }
            },
            required: ["id", "type", "question", "options", "correctAnswer", "explanation", "hint"]
          }
        },
        aiMotivation: { type: Type.STRING, description: "Personalized pep-talk or coaching message for this quiz set" }
      },
      required: ["questions", "aiMotivation"]
    };

    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.8
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.warn("Gemini Exercise Generation Error (applying offline fallback):", error);
    try {
      const { topic, difficulty, displayName } = req.body;
      const fallbackPayload = getOfflineQuizFallback(
        topic || "JavaScript & TypeScript", 
        difficulty || "Intermediate", 
        displayName || "Scholar"
      );
      res.json(fallbackPayload);
    } catch (fallbackError: any) {
      console.error("Critical fallback failure:", fallbackError);
      res.status(500).json({ error: "Failed to generate exercises" });
    }
  }
});

/**
 * Evaluate quiz attempt and calculate ELO mastery & badges
 */
app.post("/api/quiz/evaluate", async (req, res) => {
  try {
    const { userId, topic, score, totalQuestions, currentElo, streakDays, badges, displayName, level, xp, attempts, topicMastery } = req.body;

    const elo = currentElo || 1000;
    const ratio = score / totalQuestions;
    
    // ELO calculation
    // Map difficulty tier ratings: Beginner (800), Intermediate (1200), Advanced (1600)
    let quizRating = 1200; // standard intermediate baseline
    if (elo < 1000) quizRating = 800;
    else if (elo >= 1400) quizRating = 1600;

    const expectedScore = 1 / (1 + Math.pow(10, (quizRating - elo) / 400));
    const K = 40; // elo factor
    const eloDelta = Math.round(K * (ratio - expectedScore));
    const newElo = Math.max(500, elo + eloDelta);

    // Determine difficulty tier for next level
    let nextDifficulty: "Beginner" | "Intermediate" | "Advanced" = "Intermediate";
    if (newElo < 1000) {
      nextDifficulty = "Beginner";
    } else if (newElo >= 1400) {
      nextDifficulty = "Advanced";
    }

    // XP calculation: 15 XP per correct answer, 25 bonus XP for completion, 50 bonus for perfect score
    let xpGained = score * 15 + 25;
    if (score === totalQuestions) xpGained += 50;

    // Check newly earned badges
    const currentBadges = new Set(badges || []);
    const newlyEarned: string[] = [];

    if (!currentBadges.has("first_quiz")) {
      newlyEarned.push("first_quiz");
    }
    if (score === totalQuestions && !currentBadges.has("perfect_score")) {
      newlyEarned.push("perfect_score");
    }
    if (streakDays >= 3 && !currentBadges.has("streak_3")) {
      newlyEarned.push("streak_3");
    }
    if (streakDays >= 5 && !currentBadges.has("streak_5")) {
      newlyEarned.push("streak_5");
    }
    if (newElo >= 1400 && !currentBadges.has("topic_master")) {
      newlyEarned.push("topic_master");
    }

    // Advanced Badges Evaluation
    const userLevel = level || 1;
    const newXP = (xp || 0) + xpGained;
    const newLevel = Math.floor(newXP / 100) + 1;

    // 6. Level 5 Badge
    if (newLevel >= 5 && !currentBadges.has("level_5")) {
      newlyEarned.push("level_5");
    }
    // 7. Level 10 Badge
    if (newLevel >= 10 && !currentBadges.has("level_10")) {
      newlyEarned.push("level_10");
    }

    // 8. Perfect 3 Badge
    const currentAttempts = attempts || [];
    const perfectScoreCount = currentAttempts.filter((a: any) => a.percentage === 100).length + (score === totalQuestions ? 1 : 0);
    if (perfectScoreCount >= 3 && !currentBadges.has("perfect_3")) {
      newlyEarned.push("perfect_3");
    }

    // 9. Knowledge Seeker Badge
    const uniqueTopics = new Set(currentAttempts.map((a: any) => a.topic));
    uniqueTopics.add(topic);
    if (uniqueTopics.size >= 5 && !currentBadges.has("knowledge_seeker")) {
      newlyEarned.push("knowledge_seeker");
    }

    // 10. High ELO 1500 Badge
    const currentTopicMastery = topicMastery || {};
    const hasHighElo = Object.entries(currentTopicMastery).some(([t, r]: any) => {
      if (t === topic) return newElo >= 1500;
      return r >= 1500;
    }) || newElo >= 1500;
    if (hasHighElo && !currentBadges.has("high_elo_1500")) {
      newlyEarned.push("high_elo_1500");
    }

    // 11. Challenger Badge (advanced difficulty)
    const wasAdvanced = elo >= 1400;
    if (wasAdvanced && !currentBadges.has("challenger")) {
      newlyEarned.push("challenger");
    }

    // 12. Polymath Badge (topics across 3 fields)
    const getTopicField = (topicName: string): string => {
      const FIELD_TOPICS: Record<string, string[]> = {
        "Medical": ["Human Anatomy & Physiology", "Clinical Pharmacology & Therapeutics", "Medical Microbiology & Immunology", "Pathology & Disease Mechanisms", "Biochemistry & Genetics Foundations", "Neuroscience & Brain Disorders", "Pediatrics & Child Health", "Cardiovascular & Respiratory Systems", "Epidemiology & Public Health", "Medical Ethics & Jurisprudence", "Surgical Principles & Wound Care", "Diagnostic Imaging & Radiology", "Emergency Medicine & Triage", "Endocrinology & Metabolic Disorders", "Psychiatry & Mental Health Principles"],
        "Commerce": ["Financial Accounting & Reporting", "Corporate Finance & Valuations", "Microeconomics & Market Structures", "Macroeconomics & Fiscal Policies", "Business Law & Contractual Frameworks", "Marketing Management & Strategy", "Human Resource Management", "Operations & Supply Chain Logistics", "Strategic Management & Case Analysis", "Auditing & Assurance Standards", "Investment Analysis & Portfolio Management", "International Business & Global Trade", "Consumer Behavior & Research", "E-Commerce & Digital Business Models", "Entrepreneurship & Venture Capital"],
        "Engineering": ["Structural Engineering & Mechanics", "Thermodynamics & Heat Transfer", "Circuit Theory & Electronics", "Fluid Dynamics & Aerodynamics", "Material Science & Metallurgy", "Control Systems Engineering", "Power Systems & Electrical Machines", "Mechanical Design & CAD Modeling", "Chemical Reaction Engineering", "Civil Surveying & Geotechnical Engineering", "Signal Processing & Communications", "Robotics & Mechatronics Systems", "Renewable Energy Systems & Grid Integrations", "Manufacturing Processes & Automation", "Environmental Engineering & Water Treatment"],
        "Technology": ["JavaScript & TypeScript", "Python Programming", "Data Structures & Algorithms", "Web Styling (HTML & Tailwind CSS)", "Relational Databases & SQL", "Cloud Computing & DevOps", "Artificial Intelligence & Machine Learning", "Cybersecurity & Penetration Testing", "Mobile App Development (React Native & Flutter)", "Software Architecture & Design Patterns", "Version Control & Git Workflows", "Distributed Systems & Microservices", "Human-Computer Interaction & UX Design", "Blockchain & Decentralized Ledgers", "Computer Networks & Internet Protocols"],
        "Other": ["Statistics & Data Analysis", "Scientific Writing & Research Methods", "Academic Psychology Foundations", "Creative Writing & Literature Studies", "World History & Global Civilizations", "Environmental Science & Sustainability", "Sociology & Social Structures", "Philosophical Inquiry & Critical Thinking", "Digital Arts & Graphic Design Principles", "Astronomy & Planetary Astrophysics", "Political Science & Comparative Governments", "Linguistics & Language Acquisition", "Music Theory & Audio Engineering Basics", "Introduction to Anthropology", "Public Speaking & Rhetoric"]
      };
      for (const [f, topics] of Object.entries(FIELD_TOPICS)) {
        if (topics.includes(topicName)) return f;
      }
      return "Other";
    };

    const attemptedFields = new Set(currentAttempts.map((a: any) => getTopicField(a.topic)));
    attemptedFields.add(getTopicField(topic));
    if (attemptedFields.size >= 3 && !currentBadges.has("polymath")) {
      newlyEarned.push("polymath");
    }

    // 13 & 14. Night Owl / Early Bird Badges
    const currentHour = new Date().getHours();
    if ((currentHour >= 22 || currentHour < 4) && !currentBadges.has("night_owl")) {
      newlyEarned.push("night_owl");
    } else if ((currentHour >= 5 && currentHour < 9) && !currentBadges.has("early_bird")) {
      newlyEarned.push("early_bird");
    }

    // 15. XP Hoarder Badge
    if (newXP >= 1000 && !currentBadges.has("xp_hoarder")) {
      newlyEarned.push("xp_hoarder");
    }

    // 16. Ten Club Badge
    const totalQuizCompleted = currentAttempts.length + 1;
    if (totalQuizCompleted >= 10 && !currentBadges.has("ten_club")) {
      newlyEarned.push("ten_club");
    }

    // 17. Medical Expert Badge
    const completedMedicalTopics = new Set(
      [topic, ...currentAttempts.map((a: any) => a.topic)].filter((t: string) => getTopicField(t) === "Medical")
    );
    if (completedMedicalTopics.size >= 3 && !currentBadges.has("medical_expert")) {
      newlyEarned.push("medical_expert");
    }

    // 18. Commerce Expert Badge
    const completedCommerceTopics = new Set(
      [topic, ...currentAttempts.map((a: any) => a.topic)].filter((t: string) => getTopicField(t) === "Commerce")
    );
    if (completedCommerceTopics.size >= 3 && !currentBadges.has("commerce_expert")) {
      newlyEarned.push("commerce_expert");
    }

    // 19. Engineering Expert Badge
    const completedEngineeringTopics = new Set(
      [topic, ...currentAttempts.map((a: any) => a.topic)].filter((t: string) => getTopicField(t) === "Engineering")
    );
    if (completedEngineeringTopics.size >= 3 && !currentBadges.has("engineering_expert")) {
      newlyEarned.push("engineering_expert");
    }

    // 20. Tech Expert Badge
    const completedTechTopics = new Set(
      [topic, ...currentAttempts.map((a: any) => a.topic)].filter((t: string) => getTopicField(t) === "Technology")
    );
    if (completedTechTopics.size >= 3 && !currentBadges.has("tech_expert")) {
      newlyEarned.push("tech_expert");
    }

    // Call Gemini to generate dynamic AI tutor feedback analysis
    const feedbackPrompt = `
      You are TutorCloud's smart adaptive AI learning coach.
      Write a short, engaging feedback message (2-3 sentences) analyzing this student's quiz:
      - Student Name: ${displayName || 'Scholar'}
      - Topic: ${topic}
      - Score: ${score}/${totalQuestions} (${Math.round(ratio * 100)}%)
      - Elo Mastery rating: updated from ${elo} to ${newElo} (change: ${eloDelta >= 0 ? '+' : ''}${eloDelta})
      - Streak: ${streakDays} days
      - Newly unlocked badges: ${newlyEarned.join(", ") || "none"}
      
      Give constructive, motivating feedback. If they scored poorly, offer a helpful tip. If they aced it, celebrate their mastery jump!
    `;

    let aiFeedback = "";
    try {
      const aiFeedbackResponse = await generateContentWithFallback({
        contents: feedbackPrompt,
        config: {
          temperature: 0.7,
        }
      });
      aiFeedback = aiFeedbackResponse.text?.trim() || "";
    } catch (feedbackError: any) {
      console.warn("Gemini evaluation feedback failed (applying offline message):", feedbackError);
      aiFeedback = getOfflineEvaluationFallback(
        topic,
        score,
        totalQuestions,
        eloDelta,
        newElo,
        streakDays,
        displayName
      );
    }

    res.json({
      eloDelta,
      newElo,
      xpGained,
      nextDifficulty,
      newlyEarned,
      aiFeedback: aiFeedback || "Great effort! Let's continue practicing to build your mastery."
    });
  } catch (error: any) {
    console.warn("Evaluation error:", error);
    res.status(500).json({ error: error.message || "Failed to evaluate quiz" });
  }
});

/**
 * Generate highly personalized dynamic reminders (FCM mockup / scheduler)
 */
app.post("/api/reminders/generate", async (req, res) => {
  try {
    const { displayName, streakDays, weakTopics, badges } = req.body;

    const isStreakAtRisk = streakDays > 0;
    const topicsText = weakTopics && weakTopics.length > 0 ? weakTopics.join(", ") : "programming and coding";

    const prompt = `
      You are TutorCloud's push notification engine. Create a personalized push reminder for a student:
      - Name: ${displayName || 'Student'}
      - Streak: ${streakDays} days
      - Weak topics to improve: ${topicsText}
      - Badges earned: ${badges?.join(", ") || "none"}
      
      Requirements:
      1. Choose one of these styles:
         - "STREAK_WARNING": (If streak > 0) Urgent, friendly warning that their ${streakDays}-day streak is about to break unless they complete a quick quiz.
         - "NEW_CHALLENGE": Personalized invitation to tackle their weak topic (${topicsText}) to earn XP.
         - "WEEKLY_INSPIRE": Energetic message celebrating their learning profile.
      2. Return a JSON object with: title, body, type, and motivationalTip. Keep the body short, snappy, and suitable for a mobile notification.
    `;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Short snappy notification title, max 40 chars. Use emojis." },
        body: { type: Type.STRING, description: "Engaging, action-oriented body text, max 100 chars." },
        type: { type: Type.STRING, description: "Must be 'streak_alert', 'new_exercise', or 'weekly_summary'" },
        motivationalTip: { type: Type.STRING, description: "An extra tip for their dashboard study desk." }
      },
      required: ["title", "body", "type", "motivationalTip"]
    };

    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.85
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json({
      ...parsedData,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.warn("Reminder generation error (applying offline fallback):", error);
    try {
      const { displayName, streakDays, weakTopics } = req.body;
      const offlineReminder = getOfflineReminderFallback(displayName, streakDays, weakTopics);
      res.json({
        ...offlineReminder,
        timestamp: new Date().toISOString()
      });
    } catch (fallbackError: any) {
      console.error("Critical fallback failure:", fallbackError);
      res.status(500).json({ error: "Failed to generate reminder" });
    }
  }
});

// Serve Vite dev server or production assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
