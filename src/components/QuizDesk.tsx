import React, { useState, useEffect } from "react";
import { StudentProfile, QuizQuestion, TOPICS, Difficulty, FIELD_TOPICS, QuizAttempt } from "../types";
import { 
  Sparkles, 
  Brain, 
  HelpCircle, 
  Lightbulb, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  BookOpen, 
  Award, 
  Activity, 
  RefreshCw,
  Search,
  X,
  Flame,
  TrendingUp,
  Cpu,
  Bookmark,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  ShieldCheck,
  Zap,
  RotateCcw,
  Clipboard,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface QuizDeskProps {
  profile: StudentProfile;
  attempts: QuizAttempt[];
  activeTopic: string | null;
  onSelectTopic: (topic: string | null) => void;
  onQuizSubmit: (result: {
    topic: string;
    difficulty: Difficulty;
    score: number;
    totalQuestions: number;
    xpGained: number;
    eloDelta: number;
    timestamp: string;
    badgesEarned: string[];
  }) => void;
}

// Visual theme configurations for different academic streams
const FIELD_THEMES: Record<string, {
  color: string;
  bg: string;
  border: string;
  hoverBorder: string;
  text: string;
  accent: string;
  accentText: string;
  iconBg: string;
}> = {
  Medical: {
    color: "rose",
    bg: "bg-rose-500/5",
    border: "border-rose-500/10",
    hoverBorder: "hover:border-rose-500/30 hover:bg-rose-500/10",
    text: "text-rose-400",
    accent: "bg-rose-400/15 border-rose-400/20",
    accentText: "text-rose-300",
    iconBg: "bg-rose-500/10 text-rose-400"
  },
  Commerce: {
    color: "emerald",
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/10",
    hoverBorder: "hover:border-emerald-500/30 hover:bg-emerald-500/10",
    text: "text-emerald-400",
    accent: "bg-emerald-400/15 border-emerald-400/20",
    accentText: "text-emerald-300",
    iconBg: "bg-emerald-500/10 text-emerald-400"
  },
  Engineering: {
    color: "amber",
    bg: "bg-amber-500/5",
    border: "border-amber-500/10",
    hoverBorder: "hover:border-amber-500/30 hover:bg-amber-500/10",
    text: "text-amber-400",
    accent: "bg-amber-400/15 border-amber-400/20",
    accentText: "text-amber-300",
    iconBg: "bg-amber-500/10 text-amber-400"
  },
  Technology: {
    color: "cyan",
    bg: "bg-cyan-500/5",
    border: "border-cyan-500/10",
    hoverBorder: "hover:border-cyan-500/30 hover:bg-cyan-500/10",
    text: "text-cyan-400",
    accent: "bg-cyan-400/15 border-cyan-400/20",
    accentText: "text-cyan-300",
    iconBg: "bg-cyan-500/10 text-cyan-400"
  },
  Other: {
    color: "violet",
    bg: "bg-violet-500/5",
    border: "border-violet-500/10",
    hoverBorder: "hover:border-violet-500/30 hover:bg-violet-500/10",
    text: "text-violet-400",
    accent: "bg-violet-400/15 border-violet-400/20",
    accentText: "text-violet-300",
    iconBg: "bg-violet-500/10 text-violet-400"
  }
};

export default function QuizDesk({ profile, attempts, activeTopic, onSelectTopic, onQuizSubmit }: QuizDeskProps) {
  const [loading, setLoading] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [aiMotivation, setAiMotivation] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showHint, setShowHint] = useState(false);
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedField, setSelectedField] = useState<string>("All");

  // Quick Notes state & persistence
  const [notesText, setNotesText] = useState("");
  const [notesSaved, setNotesSaved] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (activeTopic) {
      const storageKey = `tutorcloud_notes_${profile.userId || 'guest'}_${activeTopic}`;
      const savedNotes = localStorage.getItem(storageKey) || "";
      setNotesText(savedNotes);
      setNotesSaved(true);
    }
  }, [activeTopic, profile.userId]);

  useEffect(() => {
    if (!activeTopic || notesSaved) return;
    const timeoutId = setTimeout(() => {
      setNotesSaved(true);
    }, 600);
    return () => clearTimeout(timeoutId);
  }, [notesText, activeTopic]);

  const handleNotesChange = (text: string) => {
    setNotesText(text);
    setNotesSaved(false);
    if (activeTopic) {
      const storageKey = `tutorcloud_notes_${profile.userId || 'guest'}_${activeTopic}`;
      localStorage.setItem(storageKey, text);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(notesText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Dynamic calibration loading steps
  const [calibrationStep, setCalibrationStep] = useState(0);

  // Quiz completion states
  const [quizFinished, setQuizFinished] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    eloDelta: number;
    newElo: number;
    xpGained: number;
    nextDifficulty: Difficulty;
    newlyEarned: string[];
    aiFeedback: string;
  } | null>(null);

  // Determine which focus stream a topic belongs to
  const getTopicField = (topicName: string): string => {
    for (const [field, topics] of Object.entries(FIELD_TOPICS)) {
      if (topics.includes(topicName)) {
        return field;
      }
    }
    return "Other";
  };

  // Adaptive recommendation logic
  const getRecommendedTopic = () => {
    const focusField = profile.fieldOfStudy || "Engineering";
    const focusTopics = FIELD_TOPICS[focusField] || FIELD_TOPICS["Engineering"];
    
    if (!focusTopics || focusTopics.length === 0) return null;

    let targetTopic = focusTopics[0];
    let minElo = profile.topicMastery?.[targetTopic] ?? 1000;

    focusTopics.forEach((topic) => {
      const elo = profile.topicMastery?.[topic] ?? 1000;
      if (elo < minElo) {
        minElo = elo;
        targetTopic = topic;
      }
    });

    return {
      topic: targetTopic,
      elo: minElo,
      field: focusField,
      reason: minElo < 1000 
        ? "Calibrate and raise your rating above beginner thresholds" 
        : `Primary focus area aligned with your ${focusField} studies`
    };
  };

  const recommendation = getRecommendedTopic();

  // Progressively cycle the AI calibration status loading steps
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setCalibrationStep(0);
      interval = setInterval(() => {
        setCalibrationStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Generate customized quiz from Server API
  const generateQuiz = async (topic: string) => {
    setLoading(true);
    setQuizFinished(false);
    setEvaluationResult(null);
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    setShowHint(false);
    setShowExplanation({});

    // Determine current ELO difficulty
    const currentElo = profile.topicMastery?.[topic] || 1000;
    let difficulty: Difficulty = "Intermediate";
    if (currentElo < 1000) difficulty = "Beginner";
    else if (currentElo >= 1400) difficulty = "Advanced";

    try {
      const response = await fetch("/api/generate-exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          difficulty,
          displayName: profile.displayName,
          earnedBadges: profile.badges,
          fieldOfStudy: profile.fieldOfStudy,
          weakAreas: currentElo < 1100 ? ["Core mechanics", "Error handling"] : []
        })
      });

      if (!response.ok) throw new Error("Could not fetch unique questions.");
      const data = await response.json();
      
      setQuizQuestions(data.questions || []);
      setAiMotivation(data.aiMotivation || "");
    } catch (error) {
      console.warn("Error creating quiz:", error);
      // Fallback questions if API fails
      setQuizQuestions([
        {
          id: "q_fallback_1",
          type: "mcq",
          question: `What is a core operational priority inside "${topic}"?`,
          options: [
            "Empirical evaluation & error handling",
            "Pre-compiled linear schemas",
            "Abstract state representation models",
            "Simulated local execution environments"
          ],
          correctAnswer: "Empirical evaluation & error handling",
          explanation: `In the comprehensive studying of ${topic}, standard operational parameters dictate robust error boundaries and precise empirical calibrations.`,
          hint: "Focus on dynamic mitigation models."
        }
      ]);
      setAiMotivation("TutorCloud is operating in resilient fallback mode.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (questionId: string, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNextQuestion = () => {
    setShowHint(false);
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      submitQuiz();
    }
  };

  // Evaluate attempt and update profile
  const submitQuiz = async () => {
    if (!activeTopic) return;
    setEvaluating(true);

    // Calculate score
    let score = 0;
    quizQuestions.forEach((q) => {
      const uAns = (userAnswers[q.id] || "").trim().toLowerCase();
      const cAns = q.correctAnswer.trim().toLowerCase();
      if (q.type === "mcq") {
        if (uAns === cAns) score++;
      } else if (q.type === "fill_blank") {
        if (uAns === cAns || cAns.includes(uAns) && uAns.length > 2) score++;
      } else {
        const keywords = cAns.split(" ");
        const matchCount = keywords.filter(k => k.length > 3 && uAns.includes(k.toLowerCase())).length;
        if (matchCount >= 1 || uAns.length > 10) score++;
      }
    });

    const currentElo = profile.topicMastery?.[activeTopic] || 1000;

    try {
      const response = await fetch("/api/quiz/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile.userId,
          topic: activeTopic,
          score,
          totalQuestions: quizQuestions.length,
          currentElo,
          streakDays: profile.streakDays,
          badges: profile.badges,
          displayName: profile.displayName,
          level: profile.level,
          xp: profile.xp,
          attempts,
          topicMastery: profile.topicMastery
        })
      });

      if (!response.ok) throw new Error("Failed to evaluate quiz.");
      const data = await response.json();

      setEvaluationResult(data);
      setQuizFinished(true);

      onQuizSubmit({
        topic: activeTopic,
        difficulty: currentElo < 1000 ? "Beginner" : currentElo >= 1400 ? "Advanced" : "Intermediate",
        score,
        totalQuestions: quizQuestions.length,
        xpGained: data.xpGained,
        eloDelta: data.eloDelta,
        timestamp: new Date().toISOString(),
        badgesEarned: data.newlyEarned
      });
    } catch (error) {
      console.warn("Evaluation submission error:", error);
      const fallbackXPGained = score * 20;
      const fallbackEloDelta = 15;
      setEvaluationResult({
        eloDelta: fallbackEloDelta,
        newElo: currentElo + fallbackEloDelta,
        xpGained: fallbackXPGained,
        nextDifficulty: "Intermediate",
        newlyEarned: [],
        aiFeedback: "Local assessment compiled successfully! Your rating has evolved."
      });
      setQuizFinished(true);

      onQuizSubmit({
        topic: activeTopic,
        difficulty: currentElo < 1000 ? "Beginner" : currentElo >= 1400 ? "Advanced" : "Intermediate",
        score,
        totalQuestions: quizQuestions.length,
        xpGained: fallbackXPGained,
        eloDelta: fallbackEloDelta,
        timestamp: new Date().toISOString(),
        badgesEarned: []
      });
    } finally {
      setEvaluating(false);
    }
  };

  const handleDownloadReportFromQuiz = () => {
    if (!evaluationResult || !activeTopic) return;
    const dateStr = new Date().toLocaleDateString();
    
    const reportMarkdown = `
# TutorCloud Performance Diagnostic Report
**Date Generated:** ${dateStr}
**Scholar:** ${profile.displayName}
**Topic Evaluated:** ${activeTopic}
**Final Score:** ${quizQuestions.filter(q => {
      const uAns = userAnswers[q.id] || "";
      return q.type === "mcq" 
        ? uAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
        : q.correctAnswer.trim().toLowerCase().includes(uAns.trim().toLowerCase()) && uAns.length > 2;
    }).length}/${quizQuestions.length}

## Performance Metrics
- **Adaptive Rating Shift:** ${evaluationResult.eloDelta >= 0 ? "+" : ""}${evaluationResult.eloDelta} ELO (New Rating: ${evaluationResult.newElo} ELO)
- **Experience points gained:** +${evaluationResult.xpGained} XP
- **Target Difficulty Level:** ${evaluationResult.nextDifficulty}

## AI Diagnostic Analysis
"${evaluationResult.aiFeedback}"

## Detailed Review
${quizQuestions.map((q, idx) => {
  const uAns = userAnswers[q.id] || "No Answer";
  const isCorrect = q.type === "mcq" 
    ? uAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
    : q.correctAnswer.trim().toLowerCase().includes(uAns.trim().toLowerCase()) && uAns.length > 2;
  return `
### Question ${idx + 1}: ${q.question}
- **Your Answer:** ${uAns}
- **Correct Answer:** ${q.correctAnswer}
- **Status:** ${isCorrect ? "✅ Correct" : "❌ Incorrect"}
- **Pedagogical Explanation:** ${q.explanation}
`;
}).join("\n")}

---
*Generated automatically by TutorCloud Adaptive ELO Engine*
`;

    const blob = new Blob([reportMarkdown.trim()], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `tutorcloud_${activeTopic.toLowerCase().replace(/\s+/g, "_")}_results.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const topicsToSearch = selectedField === "All" 
    ? TOPICS 
    : (FIELD_TOPICS[selectedField] || []);

  const filteredTopics = topicsToSearch.filter((topic) =>
    topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeQuestion = quizQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quizQuestions.length - 1;

  return (
    <div className="glass-panel p-6 md:p-8" id="quiz_desk_wrapper">
      {!activeTopic ? (
        /* ==================== SELECTOR DECK ==================== */
        <div className="space-y-8" id="topic_selector_intro">
          {/* Top Banner Header */}
          <div className="text-center max-w-2xl mx-auto py-4">
            <div className="inline-flex p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-2xl mb-4 shadow-inner">
              <Brain className="h-6 w-6 animate-pulse" />
            </div>
            <h2 className="text-3xl font-display font-extrabold text-white tracking-tight">
              Adaptive Study Arena
            </h2>
            <p className="text-sm text-white/60 mt-2 max-w-lg mx-auto leading-relaxed">
              Calibrate your expertise with real-time ELO rating. TutorCloud builds custom, adaptive problems matching your educational focus.
            </p>
          </div>

          {/* Smart Session Recommendation Card */}
          {recommendation && (
            <div 
              onClick={() => {
                onSelectTopic(recommendation.topic);
                generateQuiz(recommendation.topic);
              }}
              className="p-5 bg-gradient-to-r from-cyan-950/40 via-slate-900/40 to-violet-950/20 border border-cyan-500/20 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-cyan-400/40 cursor-pointer transition-all duration-300 relative overflow-hidden group shadow-md shadow-cyan-950/10"
              id="recommended_session_card"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500 rounded-full filter blur-[50px] opacity-10"></div>
              <div className="space-y-1.5 relative z-10">
                <div className="inline-flex items-center space-x-1.5 text-[10px] bg-cyan-400/15 text-cyan-300 border border-cyan-400/20 px-2.5 py-0.5 rounded-full font-mono font-bold uppercase">
                  <Sparkles className="h-2.5 w-2.5 animate-bounce" />
                  <span>Recommended Next Step</span>
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition duration-150">
                  {recommendation.topic}
                </h4>
                <p className="text-xs text-white/50 leading-relaxed max-w-md">
                  {recommendation.reason}
                </p>
              </div>

              <div className="flex items-center space-x-3 self-end md:self-auto relative z-10">
                <span className="text-xs text-white/40 font-mono">
                  Current ELO: <strong className="text-white font-bold">{recommendation.elo}</strong>
                </span>
                <span className="p-2 bg-cyan-400 text-slate-950 rounded-xl group-hover:translate-x-1 transition duration-200">
                  <ArrowRight className="h-4 w-4 font-bold" />
                </span>
              </div>
            </div>
          )}

          {/* Academic Stream Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-2" id="field_tabs_container">
            {["All", "Medical", "Commerce", "Engineering", "Technology", "Other"].map((field) => {
              const isActive = selectedField === field;
              return (
                <button
                  key={field}
                  onClick={() => setSelectedField(field)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition duration-200 cursor-pointer ${
                    isActive 
                      ? "bg-cyan-400 text-slate-950 border-cyan-400 font-extrabold shadow-md shadow-cyan-400/10" 
                      : "bg-white/5 text-white/60 border-white/5 hover:bg-white/10 hover:text-white"
                  }`}
                  id={`field_tab_${field.toLowerCase()}`}
                >
                  {field === "Other" ? "Other Fields" : field}
                </button>
              );
            })}
          </div>

          {/* Search Input Bar */}
          <div className="relative max-w-md mx-auto" id="search_topics_container">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter topics by title..."
              className="w-full bg-slate-950/40 text-sm text-white placeholder-white/30 pl-11 pr-10 py-3 rounded-2xl border border-white/10 focus:border-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition duration-200"
              id="search_topics_input"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition cursor-pointer"
                id="search_clear_btn"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Premium Grid of Topics with Visual Field-based Themes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="intro_topics_grid">
            {filteredTopics.map((topic) => {
              const rating = profile.topicMastery?.[topic] || 1000;
              const field = getTopicField(topic);
              const theme = FIELD_THEMES[field] || FIELD_THEMES["Other"];
              const proficiency = rating < 1000 ? "Beginner" : rating >= 1400 ? "Advanced" : "Intermediate";

              return (
                <button
                  key={topic}
                  onClick={() => {
                    onSelectTopic(topic);
                    generateQuiz(topic);
                  }}
                  className={`p-5 text-left bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex justify-between items-center transition duration-300 cursor-pointer group shadow-sm hover:shadow-md hover:scale-[1.01] ${theme.hoverBorder}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${theme.accent} ${theme.accentText}`}>
                        {field}
                      </span>
                    </div>
                    <h4 className="font-bold text-white text-sm group-hover:text-white leading-snug">{topic}</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] bg-white/5 text-white/70 font-mono font-medium px-2 py-0.5 rounded border border-white/5">
                        ELO: {rating}
                      </span>
                      <span className={`text-[10px] font-semibold ${
                        proficiency === "Advanced" ? "text-amber-400" : proficiency === "Intermediate" ? "text-cyan-400" : "text-emerald-400"
                      }`}>
                        {proficiency}
                      </span>
                    </div>
                  </div>
                  <div className={`p-2.5 rounded-xl bg-white/5 text-white/40 group-hover:bg-cyan-500/10 group-hover:text-cyan-400 transition-all duration-300`}>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </button>
              );
            })}
          </div>

          {filteredTopics.length === 0 && (
            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10" id="search_no_results">
              <p className="text-sm text-white/60">No matching subjects found in this stream.</p>
              <button
                onClick={() => setSearchTerm("")}
                className="mt-3 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl transition duration-200 cursor-pointer"
                id="btn_reset_search"
              >
                Reset Search Filters
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ==================== ACTIVE QUIZ SPLIT VIEW ==================== */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="quiz_session_split_container">
          {/* Left Column: Quiz Arena */}
          <div className="lg:col-span-2 space-y-6" id="quiz_arena">
          {/* Header Action Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-5 gap-4" id="quiz_header">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest font-mono flex items-center space-x-1">
                  <Activity className="h-3 w-3 animate-pulse" />
                  <span>Interactive Adaptive Calibration</span>
                </span>
              </div>
              <h3 className="text-xl font-display font-bold text-white mt-1.5 leading-tight">{activeTopic}</h3>
            </div>
            <button
              onClick={() => onSelectTopic(null)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 text-xs font-bold rounded-xl transition-all border border-white/10 cursor-pointer flex items-center space-x-2"
              id="btn_back_dashboard"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Back to Desk</span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              /* Upgraded AI Synthesis Loading Screen */
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-16 px-4 space-y-6"
                id="quiz_loading"
              >
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-white/5"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin"></div>
                  <div className="absolute inset-4 rounded-full bg-slate-950/60 flex items-center justify-center border border-white/10">
                    <Cpu className="h-6 w-6 text-cyan-400 animate-pulse" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-display font-extrabold text-lg text-white">Gemini ELO Calibration Engine</h4>
                  <p className="text-xs text-white/40 max-w-sm mx-auto leading-relaxed">
                    Analyzing profile history and designing exercises formatted for your focus area...
                  </p>
                </div>

                {/* Micro-terminal-style simulation progress */}
                <div className="max-w-xs mx-auto bg-slate-950/80 border border-white/10 rounded-xl p-3.5 text-left font-mono text-[10px] text-emerald-400 space-y-1.5 shadow-inner">
                  <div className="flex items-center space-x-2">
                    <span className="text-cyan-400">●</span>
                    <span>Querying Firestore academic metrics...</span>
                  </div>
                  {calibrationStep >= 1 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-cyan-400">●</span>
                      <span>Targeting ELO Rating: {profile.topicMastery?.[activeTopic] || 1000}</span>
                    </div>
                  )}
                  {calibrationStep >= 2 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-cyan-400">●</span>
                      <span>Baking personalized scenario analogies...</span>
                    </div>
                  )}
                  {calibrationStep >= 3 && (
                    <div className="flex items-center space-x-2 text-white animate-pulse">
                      <span>&gt; Deploying adaptive exercise pack...</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : quizFinished && evaluationResult ? (
              /* ==================== CELEBRATORY RESULTS VIEW ==================== */
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
                id="quiz_results_screen"
              >
                {/* Result Hero Banner Card */}
                <div className="p-6 md:p-8 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-white/10 rounded-3xl text-white relative overflow-hidden shadow-xl">
                  <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500 rounded-full filter blur-[80px] opacity-20"></div>
                  <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-violet-500 rounded-full filter blur-[80px] opacity-10"></div>
                  
                  <div className="flex flex-col lg:flex-row justify-between items-stretch gap-6 relative z-10">
                    <div className="space-y-4 flex-1">
                      <div className="inline-flex items-center space-x-1.5 bg-cyan-400/15 text-cyan-300 px-3 py-1 rounded-full text-xs font-bold border border-cyan-400/20 uppercase font-mono shadow-sm">
                        <Award className="h-3.5 w-3.5" />
                        <span>Calibration Complete</span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-display font-extrabold tracking-tight text-white leading-tight">
                        Adaptive Rating Updated!
                      </h3>
                      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl italic text-xs md:text-sm text-white/80 font-medium leading-relaxed">
                        "{evaluationResult.aiFeedback}"
                      </div>
                    </div>

                    <div className="flex flex-row sm:flex-col justify-center gap-4 min-w-[200px]" id="evaluation_highlights">
                      {/* ELO Delta Gauge */}
                      <div className="bg-slate-950/40 border border-white/10 p-4 rounded-2xl text-center flex-1">
                        <div className="text-[10px] text-white/40 font-bold uppercase font-mono tracking-wider">Rating Change</div>
                        <div className={`text-3xl font-extrabold font-display mt-1 ${
                          evaluationResult.eloDelta >= 0 ? "text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]" : "text-rose-400"
                        }`}>
                          {evaluationResult.eloDelta >= 0 ? "+" : ""}{evaluationResult.eloDelta}
                        </div>
                        <div className="text-[10px] text-white/40 font-mono mt-1">
                          New ELO: <span className="text-white font-bold">{evaluationResult.newElo}</span>
                        </div>
                      </div>

                      {/* XP Earned Gauge */}
                      <div className="bg-slate-950/40 border border-white/10 p-4 rounded-2xl text-center flex-1">
                        <div className="text-[10px] text-white/40 font-bold uppercase font-mono tracking-wider">Scholar XP</div>
                        <div className="text-3xl font-extrabold font-display text-cyan-400 mt-1 drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                          +{evaluationResult.xpGained}
                        </div>
                        <div className="text-[10px] text-white/40 font-mono mt-1">
                          Added to Profile
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Badge Unlocked Announcement */}
                {evaluationResult.newlyEarned && evaluationResult.newlyEarned.length > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl flex items-center space-x-4 shadow-md animate-bounce" id="achievement_banner">
                    <span className="text-4xl">🏆</span>
                    <div>
                      <h4 className="font-display font-extrabold text-amber-300 text-sm">New Credentials Unlocked!</h4>
                      <p className="text-xs text-amber-300/80 mt-0.5 leading-relaxed">
                        Excellent accuracy and calibration has unlocked: <span className="font-extrabold text-white">{evaluationResult.newlyEarned.join(", ")}</span>!
                      </p>
                    </div>
                  </div>
                )}

                {/* Detailed pedagogical question-by-question analysis */}
                <div className="space-y-5" id="staggered_explanations">
                  <div className="flex justify-between items-center">
                    <h4 className="font-display font-extrabold text-white text-lg flex items-center space-x-2">
                      <Bookmark className="h-5 w-5 text-cyan-400" />
                      <span>Pedagogical Review</span>
                    </h4>
                    <button
                      onClick={handleDownloadReportFromQuiz}
                      className="px-3.5 py-1.5 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-xs font-bold rounded-xl border border-cyan-500/30 flex items-center space-x-1.5 transition cursor-pointer"
                      id="btn_download_quiz_report"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Export Session PDF/MD</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {quizQuestions.map((q, idx) => {
                      const uAns = userAnswers[q.id] || "No Answer";
                      const isCorrect = q.type === "mcq" 
                        ? uAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
                        : q.correctAnswer.trim().toLowerCase().includes(uAns.trim().toLowerCase()) && uAns.length > 2;

                      return (
                        <div 
                          key={q.id} 
                          className={`p-5 rounded-2xl border transition-all duration-200 ${
                            isCorrect 
                              ? "bg-emerald-500/5 border-emerald-500/15" 
                              : "bg-rose-500/5 border-rose-500/15"
                          }`}
                        >
                          <div className="flex justify-between items-center flex-wrap gap-2">
                            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase ${
                              isCorrect 
                                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" 
                                : "bg-rose-500/10 text-rose-300 border-rose-500/20"
                            }`}>
                              Item {idx + 1}: {q.type.toUpperCase().replace("_", " ")}
                            </span>
                            <span className="text-xs font-mono text-white/40">
                              {isCorrect ? "Correct +15 XP" : "Calibrated Miss"}
                            </span>
                          </div>

                          <h5 className="font-bold text-white mt-3 text-base leading-snug">
                            {q.question}
                          </h5>

                          {/* MCQ options evaluation */}
                          {q.type === "mcq" && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                              {q.options.map((opt, oIdx) => {
                                const isCurrentOptCorrect = opt === q.correctAnswer;
                                const isSelectedByUser = opt === uAns;
                                const letter = String.fromCharCode(65 + oIdx);

                                return (
                                  <div 
                                    key={opt}
                                    className={`p-3.5 rounded-xl border text-xs flex justify-between items-center font-medium ${
                                      isCurrentOptCorrect 
                                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-bold shadow-sm shadow-emerald-500/5" 
                                        : isSelectedByUser 
                                        ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                                        : "bg-white/5 text-white/50 border-white/5"
                                    }`}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <span className={`text-[10px] font-mono font-bold w-5 h-5 rounded-md flex items-center justify-center ${
                                        isCurrentOptCorrect 
                                          ? "bg-emerald-500/20 text-emerald-200" 
                                          : isSelectedByUser 
                                          ? "bg-rose-500/20 text-rose-200"
                                          : "bg-white/5 text-white/40"
                                      }`}>
                                        {letter}
                                      </span>
                                      <span>{opt}</span>
                                    </div>
                                    {isCurrentOptCorrect && <Check className="h-4 w-4 text-emerald-400 font-extrabold" />}
                                    {isSelectedByUser && !isCurrentOptCorrect && <XCircle className="h-4 w-4 text-rose-400" />}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Blanks or short answers evaluation */}
                          {q.type !== "mcq" && (
                            <div className="mt-4 space-y-2">
                              <div className="text-xs flex items-center space-x-2">
                                <span className="text-white/40 font-medium">Your answer:</span>
                                <span className={`font-mono px-2 py-0.5 rounded ${isCorrect ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>
                                  {uAns || "(Empty)"}
                                </span>
                              </div>
                              <div className="text-xs flex items-center space-x-2">
                                <span className="text-white/40 font-medium">Ideal Answer:</span>
                                <span className="font-mono bg-cyan-400/15 text-cyan-300 px-2 py-0.5 rounded font-bold border border-cyan-400/20">
                                  {q.correctAnswer}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Pedagogical Toggles */}
                          <div className="mt-4 pt-4 border-t border-white/5">
                            <button
                              onClick={() => setShowExplanation(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 cursor-pointer"
                            >
                              <Lightbulb className="h-3.5 w-3.5" />
                              <span>{showExplanation[q.id] ? "Hide explanation" : "View pedagogical analysis"}</span>
                              <ChevronDown className={`h-3 w-3 transform transition-transform duration-200 ${showExplanation[q.id] ? "rotate-180" : ""}`} />
                            </button>

                            {showExplanation[q.id] && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="text-xs text-white/70 mt-3 bg-white/5 p-4 rounded-xl border border-white/10 leading-relaxed font-sans"
                              >
                                {q.explanation}
                              </motion.div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Return/Train again footer actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10" id="results_actions">
                  <button
                    onClick={() => generateQuiz(activeTopic)}
                    className="flex-1 py-3.5 glow-btn-cyan text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer shadow-md"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Train Again (Recalibrate)</span>
                  </button>
                  <button
                    onClick={() => onSelectTopic(null)}
                    className="px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white/80 text-xs font-bold rounded-xl transition border border-white/10 cursor-pointer"
                  >
                    Back to Desk
                  </button>
                </div>
              </motion.div>
            ) : (
              /* ==================== ACTIVE QUESTIONS INTERFACE ==================== */
              <motion.div
                key="questions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
                id="quiz_arena_active"
              >
                {/* AI Motivation banner */}
                {aiMotivation && (
                  <div className="p-4 bg-cyan-400/5 border border-cyan-400/20 rounded-2xl text-cyan-200 text-xs flex items-start space-x-3 shadow-md">
                    <span className="text-base leading-none">✨</span>
                    <span className="font-medium italic leading-relaxed">"{aiMotivation}"</span>
                  </div>
                )}

                {/* Progress Indicators Track */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-semibold text-white/40">
                    <span className="flex items-center space-x-1">
                      <Clock className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Continuous Calibration Track</span>
                    </span>
                    <span>Question {currentQuestionIndex + 1} of {quizQuestions.length}</span>
                  </div>
                  
                  {/* Visual Dot Progress Bar */}
                  <div className="flex items-center space-x-1.5" id="question_dots_progress">
                    {quizQuestions.map((q, qIdx) => {
                      const isActive = currentQuestionIndex === qIdx;
                      const isAnswered = userAnswers[q.id] !== undefined;
                      return (
                        <div 
                          key={q.id}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            isActive 
                              ? "w-8 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" 
                              : isAnswered 
                              ? "w-4 bg-emerald-500" 
                              : "w-2 bg-white/10"
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Prompt Card */}
                {activeQuestion && (
                  <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-6 relative overflow-hidden" id="question_card">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500 rounded-full filter blur-[50px] opacity-10"></div>
                    
                    <div className="flex justify-between items-center relative z-10">
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                        {activeQuestion.type === "mcq" ? "Multiple Choice" : activeQuestion.type === "fill_blank" ? "Fill blank" : "Short Answer"}
                      </span>
                      <button
                        onClick={() => setShowHint(!showHint)}
                        className="p-1.5 bg-white/5 text-cyan-300 border border-white/10 rounded-lg hover:bg-white/10 transition cursor-pointer flex items-center space-x-1.5 text-[10px] font-mono font-bold"
                      >
                        <HelpCircle className="h-3.5 w-3.5" />
                        <span>Need Hint?</span>
                      </button>
                    </div>

                    <h4 className="text-lg font-bold text-white leading-snug relative z-10">
                      {activeQuestion.question}
                    </h4>

                    {/* Hint overlay box */}
                    {showHint && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs leading-relaxed"
                      >
                        <span className="font-extrabold">Tutor AI Hint:</span> {activeQuestion.hint}
                      </motion.div>
                    )}

                    {/* Input controls based on question type */}
                    <div className="pt-2 relative z-10" id="question_inputs_wrapper">
                      {activeQuestion.type === "mcq" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="mcq_grid">
                          {activeQuestion.options?.map((opt, oIdx) => {
                            const isSelected = userAnswers[activeQuestion.id] === opt;
                            const letter = String.fromCharCode(65 + oIdx);
                            
                            return (
                              <button
                                key={opt}
                                onClick={() => handleSelectAnswer(activeQuestion.id, opt)}
                                className={`p-4 text-left rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer flex justify-between items-center ${
                                  isSelected 
                                    ? "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white border-transparent shadow-md shadow-cyan-500/15" 
                                    : "bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:border-white/20"
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  <span className={`text-[10px] font-mono font-bold w-5 h-5 rounded-md flex items-center justify-center ${
                                    isSelected ? "bg-white/20 text-white" : "bg-white/5 text-white/40"
                                  }`}>
                                    {letter}
                                  </span>
                                  <span>{opt}</span>
                                </div>
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  isSelected ? "bg-white/20 border-white" : "border-white/30"
                                }`}>
                                  {isSelected && <span className="w-2 h-2 rounded-full bg-white"></span>}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {activeQuestion.type === "fill_blank" && (
                        <div id="fill_blank_wrapper" className="space-y-2">
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-cyan-400 text-xs font-bold">
                              INPUT ANSWER &gt;
                            </span>
                            <input
                              type="text"
                              placeholder="Type answer here..."
                              value={userAnswers[activeQuestion.id] || ""}
                              onChange={(e) => handleSelectAnswer(activeQuestion.id, e.target.value)}
                              className="w-full pl-36 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-white font-mono text-sm transition"
                            />
                          </div>
                          <p className="text-[10px] text-white/40">Evaluation is case-insensitive.</p>
                        </div>
                      )}

                      {activeQuestion.type === "short_answer" && (
                        <div id="short_answer_wrapper" className="space-y-2">
                          <textarea
                            rows={3}
                            placeholder="Type explanation / conceptual keywords here..."
                            value={userAnswers[activeQuestion.id] || ""}
                            onChange={(e) => handleSelectAnswer(activeQuestion.id, e.target.value)}
                            className="w-full p-4 bg-white/5 border border-white/10 rounded-xl focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-white text-sm outline-none resize-none leading-relaxed transition"
                          />
                          <p className="text-[10px] text-white/40">Tutor AI evaluates accuracy based on logical semantic parameters and key terminology.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Bottom Navigation Row */}
                <div className="flex justify-between items-center pt-4 border-t border-white/10" id="quiz_navigation_footer">
                  <div className="text-[10px] text-white/40 font-mono">
                    MODEL: GEMINI-3.5-FLASH | ADAPTIVE SCENARIOS: ENGAGED
                  </div>
                  <button
                    onClick={handleNextQuestion}
                    disabled={evaluating || !userAnswers[activeQuestion?.id]}
                    className="px-6 py-3 glow-btn-cyan disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40 text-xs font-bold rounded-xl transition flex items-center space-x-2 cursor-pointer shadow-sm"
                    id="btn_quiz_next"
                  >
                    <span>{isLastQuestion ? (evaluating ? "Evaluating..." : "Submit Answers") : "Next Question"}</span>
                    {!evaluating && <ArrowRight className="h-4 w-4" />}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Persistent 'Quick Notes' Scratchpad */}
        <div className="lg:border-l lg:border-white/10 lg:pl-8 space-y-4 flex flex-col justify-between" id="quiz_notes_column">
          <div className="space-y-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-cyan-400 animate-pulse" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Quick Notes</h4>
              </div>
              
              {/* Dynamic Saving Indicator */}
              <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1 border transition-all duration-300 ${
                notesSaved 
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" 
                  : "bg-amber-500/10 text-amber-300 border-amber-500/20"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${notesSaved ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
                <span>{notesSaved ? "Saved" : "Saving..."}</span>
              </span>
            </div>

            <p className="text-[11px] text-white/50 leading-relaxed">
              Jot down key concepts, equations, or learnings for <span className="text-cyan-300 font-semibold">{activeTopic}</span>. These persist automatically!
            </p>

            {/* Textarea Scratchpad */}
            <div className="relative flex-1 min-h-[250px] flex flex-col">
              <textarea
                value={notesText}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder={`Type key concepts for ${activeTopic} here...\n\nExample:\n- Concept A: explanation\n- Formula: x = y + z`}
                className="w-full h-full flex-1 p-4 bg-slate-950/40 border border-white/10 rounded-2xl text-white text-xs placeholder-white/20 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 outline-none resize-none leading-relaxed font-sans"
                id="notes_textarea"
              />
              
              {/* Helper quick-inserts inside the textarea container bottom-right */}
              {activeQuestion && (
                <div className="absolute bottom-3 right-3 flex items-center space-x-1.5">
                  <button
                    onClick={() => {
                      const textToAppend = `\n\n📌 [Q] ${activeQuestion.question}\n💡 Hint: ${activeQuestion.hint || ''}`;
                      handleNotesChange(notesText + textToAppend);
                    }}
                    title="Add current question reference to notes"
                    className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-300 text-[9px] font-bold rounded-lg border border-cyan-500/30 transition cursor-pointer flex items-center space-x-1"
                    id="btn_add_q_reference"
                  >
                    <span>+ Add Q Ref</span>
                  </button>
                </div>
              )}
            </div>

            {/* Action triggers and templates */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => {
                  const template = `=== 🎓 ${activeTopic} Study Guide ===\n\n- Key Term 1: \n- Core Formula/Rule: \n- Common Mistakes to Avoid: \n- AI Coach Advice: \n`;
                  if (window.confirm("This will append a study guide template to your notes. Proceed?")) {
                    handleNotesChange(notesText ? notesText + "\n\n" + template : template);
                  }
                }}
                className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white/80 text-[10px] font-bold rounded-xl border border-white/10 transition cursor-pointer flex items-center justify-center space-x-1"
                id="btn_load_notes_template"
              >
                <Sparkles className="h-3 w-3 text-cyan-400" />
                <span>Load Template</span>
              </button>

              <button
                onClick={handleCopyToClipboard}
                disabled={!notesText}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-white/80 text-[10px] font-bold rounded-xl border border-white/10 transition cursor-pointer flex items-center justify-center space-x-1"
                id="btn_copy_notes"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Clipboard className="h-3 w-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>

              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to clear these notes? This cannot be undone.")) {
                    handleNotesChange("");
                  }
                }}
                disabled={!notesText}
                className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/25 disabled:opacity-40 disabled:cursor-not-allowed text-rose-300 text-[10px] font-bold rounded-xl border border-rose-500/20 transition cursor-pointer flex items-center justify-center space-x-1"
                id="btn_clear_notes"
              >
                <Trash2 className="h-3 w-3" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
}
