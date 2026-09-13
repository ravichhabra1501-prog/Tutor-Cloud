export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export interface StudentProfile {
  userId: string;
  email: string;
  displayName: string;
  xp: number;
  level: number;
  streakDays: number;
  lastActiveDate: string;
  difficultyLevel: Difficulty;
  badges: string[];
  topicMastery: Record<string, number>; // Topic -> ELO-style mastery (e.g., 1000)
  createdAt: string;
  fieldOfStudy?: "Medical" | "Commerce" | "Engineering" | "Technology" | "Other" | string;
}

export interface QuizQuestion {
  id: string;
  type: "mcq" | "fill_blank" | "short_answer";
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  hint: string;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  topic: string;
  difficulty: Difficulty;
  score: number;
  totalQuestions: number;
  percentage: number;
  xpGained: number;
  eloDelta: number;
  timestamp: string;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  xp: number;
  level: number;
  fieldOfStudy?: string;
}

export interface SimulatedReminder {
  id: string;
  title: string;
  body: string;
  type: "streak_alert" | "new_exercise" | "weekly_summary";
  motivationalTip: string;
  timestamp: string;
  isRead: boolean;
}

export const FIELD_TOPICS: Record<string, string[]> = {
  "Medical": [
    "Human Anatomy & Physiology",
    "Clinical Pharmacology",
    "Pathology & Mechanisms of Disease",
    "Medical Biochemistry",
    "Immunology & Serology",
    "Medical Microbiology & Virology",
    "Cardiovascular Medicine & Cardiology",
    "Neurology & Brain Sciences",
    "General Pediatrics & Child Health",
    "Obstetrics & Gynecology",
    "Healthcare Ethics & Medical Law",
    "Epidemiology & Public Health",
    "Diagnostic Radiology & Imaging",
    "Medical Genetics & Genomics",
    "Emergency Medicine & Trauma Care"
  ],
  "Commerce": [
    "Financial Accounting & Auditing",
    "Microeconomics & Market Analysis",
    "Corporate Finance & Capital Markets",
    "Strategic Marketing & Branding",
    "Managerial Accounting & Budgeting",
    "Macroeconomic Theory & Policy",
    "Business Law & Corporate Governance",
    "Human Resource Management",
    "Supply Chain & Logistics Operations",
    "International Business & Trade",
    "Investment Banking & Portfolio Management",
    "Taxation Laws & Tax Planning",
    "Consumer Behavior & Research",
    "E-Commerce & Digital Business Models",
    "Entrepreneurship & Venture Capital"
  ],
  "Engineering": [
    "Structural Engineering & Mechanics",
    "Thermodynamics & Heat Transfer",
    "Circuit Theory & Electronics",
    "Fluid Dynamics & Aerodynamics",
    "Material Science & Metallurgy",
    "Control Systems Engineering",
    "Power Systems & Electrical Machines",
    "Mechanical Design & CAD Modeling",
    "Chemical Reaction Engineering",
    "Civil Surveying & Geotechnical Engineering",
    "Signal Processing & Communications",
    "Robotics & Mechatronics Systems",
    "Renewable Energy Systems & Grid Integrations",
    "Manufacturing Processes & Automation",
    "Environmental Engineering & Water Treatment"
  ],
  "Technology": [
    "JavaScript & TypeScript",
    "Python Programming",
    "Data Structures & Algorithms",
    "Web Styling (HTML & Tailwind CSS)",
    "Relational Databases & SQL",
    "Cloud Computing & DevOps",
    "Artificial Intelligence & Machine Learning",
    "Cybersecurity & Penetration Testing",
    "Mobile App Development (React Native & Flutter)",
    "Software Architecture & Design Patterns",
    "Version Control & Git Workflows",
    "Distributed Systems & Microservices",
    "Human-Computer Interaction & UX Design",
    "Blockchain & Decentralized Ledgers",
    "Computer Networks & Internet Protocols"
  ],
  "Other": [
    "Statistics & Data Analysis",
    "Scientific Writing & Research Methods",
    "Academic Psychology Foundations",
    "Creative Writing & Literature Studies",
    "World History & Global Civilizations",
    "Environmental Science & Sustainability",
    "Sociology & Social Structures",
    "Philosophical Inquiry & Critical Thinking",
    "Digital Arts & Graphic Design Principles",
    "Astronomy & Planetary Astrophysics",
    "Political Science & Comparative Governments",
    "Linguistics & Language Acquisition",
    "Music Theory & Audio Engineering Basics",
    "Introduction to Anthropology",
    "Public Speaking & Rhetoric"
  ]
};

export const TOPICS = Object.values(FIELD_TOPICS).flat();

export const BADGE_DETAILS: Record<string, { title: string; desc: string; icon: string; color: string }> = {
  first_quiz: {
    title: "First Step",
    desc: "Completed your first TutorCloud quiz",
    icon: "🌱",
    color: "from-green-400 to-emerald-500"
  },
  perfect_score: {
    title: "Flawless",
    desc: "Scored 100% on any practice attempt",
    icon: "⚡",
    color: "from-amber-400 to-orange-500"
  },
  streak_3: {
    title: "Dedicated",
    desc: "Maintained a 3-day active study streak",
    icon: "🔥",
    color: "from-rose-400 to-pink-500"
  },
  streak_5: {
    title: "Unstoppable",
    desc: "Maintained a 5-day active study streak",
    icon: "👑",
    color: "from-purple-400 to-indigo-500"
  },
  topic_master: {
    title: "Master Mind",
    desc: "Reached Advanced Mastery level (ELO >= 1400) in any topic",
    icon: "🧠",
    color: "from-blue-400 to-indigo-600"
  },
  level_5: {
    title: "Rising Star",
    desc: "Reached Scholar Level 5 with persistent learning",
    icon: "🚀",
    color: "from-cyan-400 to-teal-500"
  },
  level_10: {
    title: "Sovereign Scholar",
    desc: "Reached Scholar Level 10 with elite knowledge",
    icon: "🌟",
    color: "from-yellow-400 to-amber-500"
  },
  perfect_3: {
    title: "Diamond Precision",
    desc: "Scored 100% on 3 different practice attempts",
    icon: "💎",
    color: "from-sky-400 to-indigo-500"
  },
  knowledge_seeker: {
    title: "Knowledge Seeker",
    desc: "Completed quizzes across 5 different topics",
    icon: "📚",
    color: "from-emerald-400 to-cyan-500"
  },
  high_elo_1500: {
    title: "Grand Apex",
    desc: "Reached a peak ELO rating of 1500 or more in any topic",
    icon: "🛡️",
    color: "from-amber-500 to-red-600"
  },
  challenger: {
    title: "Fearless Challenger",
    desc: "Successfully completed an Advanced difficulty quiz",
    icon: "🥊",
    color: "from-red-400 to-rose-600"
  },
  polymath: {
    title: "Universal Polymath",
    desc: "Explored topics across 3 or more academic streams",
    icon: "🗺️",
    color: "from-fuchsia-400 to-pink-600"
  },
  night_owl: {
    title: "Midnight Oil",
    desc: "Completed a quiz during late-night study hours (10 PM - 4 AM)",
    icon: "🦉",
    color: "from-slate-700 to-slate-900"
  },
  early_bird: {
    title: "Dawn Patrol",
    desc: "Completed a quiz during early morning hours (5 AM - 9 AM)",
    icon: "🌅",
    color: "from-orange-300 to-yellow-500"
  },
  xp_hoarder: {
    title: "Experience Collector",
    desc: "Accumulated a total of 1000 or more XP points",
    icon: "💰",
    color: "from-amber-500 to-emerald-500"
  },
  ten_club: {
    title: "Decathlon",
    desc: "Completed 10 total learning calibration quizzes",
    icon: "🔟",
    color: "from-teal-400 to-emerald-600"
  },
  medical_expert: {
    title: "Clinical Sage",
    desc: "Completed practice quizzes across 3 or more Medical topics",
    icon: "⚕️",
    color: "from-red-400 to-pink-500"
  },
  commerce_expert: {
    title: "Market Titan",
    desc: "Completed practice quizzes across 3 or more Commerce topics",
    icon: "📈",
    color: "from-amber-400 to-yellow-600"
  },
  engineering_expert: {
    title: "Master Architect",
    desc: "Completed practice quizzes across 3 or more Engineering topics",
    icon: "⚙️",
    color: "from-blue-400 to-cyan-600"
  },
  tech_expert: {
    title: "Silicon Sorcerer",
    desc: "Completed practice quizzes across 3 or more Technology topics",
    icon: "💻",
    color: "from-purple-400 to-indigo-600"
  }
};
