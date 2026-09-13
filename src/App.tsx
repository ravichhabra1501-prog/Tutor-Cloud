import React, { useState, useEffect } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, onSnapshot, collection, query, where, orderBy, limit, addDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./lib/firebase";
import { StudentProfile, QuizAttempt, SimulatedReminder, TOPICS } from "./types";
import AuthScreen from "./components/AuthScreen";
import Dashboard from "./components/Dashboard";
import QuizDesk from "./components/QuizDesk";
import Leaderboard from "./components/Leaderboard";
import Reminders from "./components/Reminders";
import BadgeUnlockModal from "./components/BadgeUnlockModal";
import { 
  GraduationCap, 
  LayoutDashboard, 
  Brain, 
  Trophy, 
  Bell, 
  LogOut, 
  Sparkles, 
  Flame, 
  Award,
  ChevronRight,
  Menu,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [reminders, setReminders] = useState<SimulatedReminder[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "quiz" | "leaderboard" | "reminders">("dashboard");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Floating live notification toast state
  const [activeToast, setActiveToast] = useState<SimulatedReminder | null>(null);

  // Queue of newly unlocked badge keys to display celebration animation
  const [unlockedBadgesToAnimate, setUnlockedBadgesToAnimate] = useState<string[]>([]);

  useEffect(() => {
    // Listen to Firebase Auth state
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      const savedLocalUser = localStorage.getItem("tutorcloud_local_user");
      if (savedLocalUser) {
        setUser(JSON.parse(savedLocalUser));
        setAuthChecked(true);
      } else {
        setUser(firebaseUser);
        setAuthChecked(true);
        if (!firebaseUser) {
          setProfile(null);
          setAttempts([]);
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const isSandbox = user.uid.startsWith("sandbox_");
    if (isSandbox) {
      // Load offline/sandbox state from localStorage
      const savedProfile = localStorage.getItem("tutorcloud_local_profile");
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      } else {
        const initialMastery: Record<string, number> = {};
        TOPICS.forEach((topic) => {
          initialMastery[topic] = 1000;
        });

        const defaultProfile: StudentProfile = {
          userId: user.uid,
          email: user.email || "sandbox@tutorcloud.edu",
          displayName: user.displayName || "Local Scholar",
          xp: 0,
          level: 1,
          streakDays: 1,
          lastActiveDate: new Date().toISOString().split("T")[0],
          difficultyLevel: "Beginner",
          badges: [],
          topicMastery: initialMastery,
          createdAt: new Date().toISOString(),
          fieldOfStudy: "Engineering"
        };
        localStorage.setItem("tutorcloud_local_profile", JSON.stringify(defaultProfile));
        setProfile(defaultProfile);
      }

      const savedAttempts = localStorage.getItem("tutorcloud_local_attempts");
      if (savedAttempts) {
        setAttempts(JSON.parse(savedAttempts));
      } else {
        setAttempts([]);
      }
      return;
    }

    // Real-time listener for current user's profile
    const profileRef = doc(db, "profiles", user.uid);
    const unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as StudentProfile;
        setProfile(data);
        localStorage.setItem(`tutorcloud_offline_profile_${user.uid}`, JSON.stringify(data));
      } else {
        const offlineProfile = localStorage.getItem(`tutorcloud_offline_profile_${user.uid}`);
        if (offlineProfile) {
          setProfile(JSON.parse(offlineProfile));
        }
      }
    }, (error) => {
      console.warn("Profile subscription error (falling back to offline state):", error);
      const offlineProfile = localStorage.getItem(`tutorcloud_offline_profile_${user.uid}`);
      if (offlineProfile) {
        setProfile(JSON.parse(offlineProfile));
      }
    });

    // Real-time listener for user's past quiz attempts
    const attemptsRef = collection(db, "quizAttempts");
    const q = query(
      attemptsRef,
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc"),
      limit(20)
    );

    const unsubscribeAttempts = onSnapshot(q, (snapshot) => {
      const attemptsData: QuizAttempt[] = [];
      snapshot.forEach((docSnap) => {
        attemptsData.push(docSnap.data() as QuizAttempt);
      });
      setAttempts(attemptsData);
    }, (error) => {
      console.error("Quiz attempts subscription error:", error);
    });

    return () => {
      unsubscribeProfile();
      unsubscribeAttempts();
    };
  }, [user]);

  // Handle addition of a new simulated notification
  const handleAddReminder = (reminder: SimulatedReminder) => {
    setReminders((prev) => [reminder, ...prev]);
    // Show sliding toast top right
    setActiveToast(reminder);
    setTimeout(() => {
      setActiveToast(null);
    }, 6000);
  };

  const handleClearReminders = () => {
    setReminders([]);
  };

  // Callback after completing a quiz successfully
  const handleQuizSubmit = async (result: {
    topic: string;
    difficulty: "Beginner" | "Intermediate" | "Advanced";
    score: number;
    totalQuestions: number;
    xpGained: number;
    eloDelta: number;
    timestamp: string;
    badgesEarned: string[];
  }) => {
    if (!user || !profile) return;

    const attemptId = `attempt_${Date.now()}`;
    const newAttempt: QuizAttempt = {
      id: attemptId,
      userId: user.uid,
      topic: result.topic,
      difficulty: result.difficulty,
      score: result.score,
      totalQuestions: result.totalQuestions,
      percentage: Math.round((result.score / result.totalQuestions) * 100),
      xpGained: result.xpGained,
      eloDelta: result.eloDelta,
      timestamp: result.timestamp
    };

    const isSandbox = user.uid.startsWith("sandbox_");

    if (isSandbox) {
      const updatedAttempts = [newAttempt, ...attempts];
      setAttempts(updatedAttempts);
      localStorage.setItem("tutorcloud_local_attempts", JSON.stringify(updatedAttempts));
    } else {
      // Save quiz attempt in Firestore
      const attemptRef = doc(db, "quizAttempts", attemptId);
      await setDoc(attemptRef, newAttempt);
    }

    // Update student's mastery profile & statistics
    const updatedXP = profile.xp + result.xpGained;
    const updatedLevel = Math.floor(updatedXP / 100) + 1;
    
    // Check study streak increment
    let updatedStreak = profile.streakDays;
    const todayStr = new Date().toISOString().split("T")[0];
    const lastActiveStr = profile.lastActiveDate;

    if (lastActiveStr && lastActiveStr !== todayStr) {
      const lastActiveDate = new Date(lastActiveStr);
      const todayDate = new Date(todayStr);
      const diffTime = Math.abs(todayDate.getTime() - lastActiveDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        updatedStreak += 1;
      } else if (diffDays > 1) {
        updatedStreak = 1; // streak reset
      }
    }

    // Merge unlocked badges
    const updatedBadges = [...profile.badges];
    result.badgesEarned.forEach((b) => {
      if (!updatedBadges.includes(b)) {
        updatedBadges.push(b);
      }
    });

    const currentTopicMastery = { ...profile.topicMastery };
    currentTopicMastery[result.topic] = Math.max(500, (currentTopicMastery[result.topic] || 1000) + result.eloDelta);

    // SECURE DYNAMIC CLIENT-SIDE BADGE CHECK (Provides instant unlock feedback for sandbox/offline)
    const addBadgeIfEligible = (b: string, condition: boolean) => {
      if (condition && !updatedBadges.includes(b)) {
        updatedBadges.push(b);
      }
    };

    addBadgeIfEligible("first_quiz", true);
    addBadgeIfEligible("perfect_score", result.score === result.totalQuestions);
    addBadgeIfEligible("streak_3", updatedStreak >= 3);
    addBadgeIfEligible("streak_5", updatedStreak >= 5);
    addBadgeIfEligible("topic_master", currentTopicMastery[result.topic] >= 1400);

    // 6. Level 5 Badge
    addBadgeIfEligible("level_5", updatedLevel >= 5);
    // 7. Level 10 Badge
    addBadgeIfEligible("level_10", updatedLevel >= 10);

    // 8. Perfect 3 Badge
    const perfectCount = [newAttempt, ...attempts].filter(a => a.percentage === 100).length;
    addBadgeIfEligible("perfect_3", perfectCount >= 3);

    // 9. Knowledge Seeker Badge
    const attemptedTopics = new Set([newAttempt, ...attempts].map(a => a.topic));
    addBadgeIfEligible("knowledge_seeker", attemptedTopics.size >= 5);

    // 10. High ELO 1500 Badge
    const peakElo = Object.values(currentTopicMastery).some(rating => (rating as number) >= 1500);
    addBadgeIfEligible("high_elo_1500", peakElo);

    // 11. Challenger Badge
    addBadgeIfEligible("challenger", result.difficulty === "Advanced");

    // 12. Polymath Badge
    const getTopicFieldClient = (topicName: string): string => {
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
    const attemptedFields = new Set([newAttempt, ...attempts].map(a => getTopicFieldClient(a.topic)));
    addBadgeIfEligible("polymath", attemptedFields.size >= 3);

    // 13 & 14. Night Owl / Early Bird Badges
    const completedHour = new Date().getHours();
    addBadgeIfEligible("night_owl", completedHour >= 22 || completedHour < 4);
    addBadgeIfEligible("early_bird", completedHour >= 5 && completedHour < 9);

    // 15. XP Hoarder Badge
    addBadgeIfEligible("xp_hoarder", updatedXP >= 1000);

    // 16. Ten Club Badge
    addBadgeIfEligible("ten_club", [newAttempt, ...attempts].length >= 10);

    // 17. Medical Expert Badge
    const medicalCount = [newAttempt, ...attempts].filter(a => getTopicFieldClient(a.topic) === "Medical").map(a => a.topic);
    addBadgeIfEligible("medical_expert", new Set(medicalCount).size >= 3);

    // 18. Commerce Expert Badge
    const commerceCount = [newAttempt, ...attempts].filter(a => getTopicFieldClient(a.topic) === "Commerce").map(a => a.topic);
    addBadgeIfEligible("commerce_expert", new Set(commerceCount).size >= 3);

    // 19. Engineering Expert Badge
    const engineeringCount = [newAttempt, ...attempts].filter(a => getTopicFieldClient(a.topic) === "Engineering").map(a => a.topic);
    addBadgeIfEligible("engineering_expert", new Set(engineeringCount).size >= 3);

    // 20. Tech Expert Badge
    const techCount = [newAttempt, ...attempts].filter(a => getTopicFieldClient(a.topic) === "Technology").map(a => a.topic);
    addBadgeIfEligible("tech_expert", new Set(techCount).size >= 3);

    const updatedProfile: StudentProfile = {
      ...profile,
      xp: updatedXP,
      level: updatedLevel,
      streakDays: updatedStreak,
      lastActiveDate: todayStr,
      difficultyLevel: currentTopicMastery[result.topic] < 1000 ? "Beginner" : currentTopicMastery[result.topic] >= 1400 ? "Advanced" : "Intermediate",
      badges: updatedBadges,
      topicMastery: currentTopicMastery
    };

    // Queue newly unlocked badges for visual animation celebration
    const newlyUnlockedBadges = updatedBadges.filter(b => !profile.badges.includes(b));
    if (newlyUnlockedBadges.length > 0) {
      setUnlockedBadgesToAnimate(prev => [...prev, ...newlyUnlockedBadges]);
    }

    if (isSandbox) {
      setProfile(updatedProfile);
      localStorage.setItem("tutorcloud_local_profile", JSON.stringify(updatedProfile));

      // Update simulated leaderboard state
      const currentLocalLeaderboard = JSON.parse(localStorage.getItem("tutorcloud_local_leaderboard") || "[]");
      const updatedLocalLeaderboard = currentLocalLeaderboard.map((entry: any) => {
        if (entry.userId === user.uid) {
          return {
            ...entry,
            xp: updatedXP,
            level: updatedLevel,
            fieldOfStudy: profile.fieldOfStudy || "Engineering"
          };
        }
        return entry;
      });
      if (!updatedLocalLeaderboard.some((entry: any) => entry.userId === user.uid)) {
        updatedLocalLeaderboard.push({
          userId: user.uid,
          displayName: profile.displayName,
          xp: updatedXP,
          level: updatedLevel,
          fieldOfStudy: profile.fieldOfStudy || "Engineering"
        });
      }
      localStorage.setItem("tutorcloud_local_leaderboard", JSON.stringify(updatedLocalLeaderboard));
    } else {
      // Optimistically update the local React state and offline backup instantly
      setProfile(updatedProfile);
      localStorage.setItem(`tutorcloud_offline_profile_${user.uid}`, JSON.stringify(updatedProfile));

      try {
        // Update profiles document
        await setDoc(doc(db, "profiles", user.uid), updatedProfile);

        // Update global highscore leaderboard
        await setDoc(doc(db, "leaderboard", user.uid), {
          userId: user.uid,
          displayName: profile.displayName,
          xp: updatedXP,
          level: updatedLevel,
          fieldOfStudy: profile.fieldOfStudy || "Engineering"
        });
      } catch (firestoreError) {
        console.warn("Firestore offline or write failed. Preserving local state:", firestoreError);
      }
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("tutorcloud_local_user");
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Firebase signOut failed:", e);
    }
    setUser(null);
    setProfile(null);
    setAttempts([]);
  };

  const handleUpdateFieldOfStudy = async (fieldOfStudy: string) => {
    if (!user || !profile) return;

    const updatedProfile: StudentProfile = {
      ...profile,
      fieldOfStudy
    };

    const isSandbox = user.uid.startsWith("sandbox_");
    if (isSandbox) {
      setProfile(updatedProfile);
      localStorage.setItem("tutorcloud_local_profile", JSON.stringify(updatedProfile));

      // Update simulated leaderboard state
      const currentLocalLeaderboard = JSON.parse(localStorage.getItem("tutorcloud_local_leaderboard") || "[]");
      const updatedLocalLeaderboard = currentLocalLeaderboard.map((entry: any) => {
        if (entry.userId === user.uid) {
          return {
            ...entry,
            fieldOfStudy
          };
        }
        return entry;
      });
      localStorage.setItem("tutorcloud_local_leaderboard", JSON.stringify(updatedLocalLeaderboard));
    } else {
      setProfile(updatedProfile);
      localStorage.setItem(`tutorcloud_offline_profile_${user.uid}`, JSON.stringify(updatedProfile));

      try {
        await setDoc(doc(db, "profiles", user.uid), updatedProfile);

        // Update global highscore leaderboard too
        await setDoc(doc(db, "leaderboard", user.uid), {
          userId: user.uid,
          displayName: profile.displayName,
          xp: profile.xp,
          level: profile.level,
          fieldOfStudy
        });
      } catch (firestoreError) {
        console.warn("Firestore offline or write failed. Preserving local state:", firestoreError);
      }
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans relative overflow-hidden">
        {/* Mesh Gradient Atmospheric Backdrops */}
        <div className="absolute top-[30%] left-[30%] w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none z-0"></div>
        <div className="relative z-10 w-12 h-12 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-white/5"></div>
          <div className="absolute inset-0 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin"></div>
        </div>
        <span className="relative z-10 text-xs text-white/40 font-medium font-mono">Synchronizing Secure Workspace...</span>
      </div>
    );
  }

  if (!user || !profile) {
    return <AuthScreen onAuthSuccess={() => setActiveTab("dashboard")} />;
  }

  // Count unread notifications
  const unreadCount = reminders.filter((r) => !r.isRead).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-hidden">
      {/* Mesh Gradient Atmospheric Backdrops */}
      <div className="absolute top-[-15%] left-[-5%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

      {/* Real-time Floating Notification Banner */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 glass-panel-heavy border border-white/20 p-4 rounded-2xl shadow-2xl max-w-sm text-white flex items-start space-x-3"
            id="floating_nudge_toast"
          >
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl mt-0.5">
              <Bell className="h-4 w-4 animate-bounce" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider font-mono">TutorCloud Nudge</span>
                <span className="text-[9px] text-white/40 font-mono">Just Now</span>
              </div>
              <h5 className="font-bold text-sm text-white">{activeToast.title}</h5>
              <p className="text-xs text-white/60 leading-relaxed">{activeToast.body}</p>
              <button 
                onClick={() => {
                  setActiveTab("quiz");
                  setSelectedTopic(TOPICS[0]);
                  setActiveToast(null);
                }}
                className="text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center space-x-0.5 pt-1.5 cursor-pointer font-mono"
              >
                <span>Jump In</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Header */}
      <header className="sticky top-0 z-40 bg-slate-950/40 backdrop-blur-xl border-b border-white/10" id="primary_nav_bar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              {/* App Logo */}
              <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setActiveTab("dashboard")} id="app_logo_link">
                <div className="w-9 h-9 bg-gradient-to-tr from-violet-600 to-cyan-400 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-cyan-500/20 border border-white/20">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <span className="font-display font-bold text-xl tracking-tight text-white">TutorCloud <span className="text-cyan-400">Agent</span></span>
              </div>

              {/* Desktop Tabs */}
              <nav className="hidden md:flex space-x-1" id="desktop_nav_pills">
                <button
                  onClick={() => { setActiveTab("dashboard"); setSelectedTopic(null); }}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center space-x-2 ${
                    activeTab === "dashboard" ? "glass-button-active" : "glass-button"
                  }`}
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span>Learning Desk</span>
                </button>
                <button
                  onClick={() => setActiveTab("quiz")}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center space-x-2 ${
                    activeTab === "quiz" ? "glass-button-active" : "glass-button"
                  }`}
                >
                  <Brain className="h-3.5 w-3.5" />
                  <span>Adaptive Challenge</span>
                </button>
                <button
                  onClick={() => setActiveTab("leaderboard")}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center space-x-2 ${
                    activeTab === "leaderboard" ? "glass-button-active" : "glass-button"
                  }`}
                >
                  <Trophy className="h-3.5 w-3.5" />
                  <span>Scholar Rankings</span>
                </button>
                <button
                  onClick={() => setActiveTab("reminders")}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center space-x-2 relative ${
                    activeTab === "reminders" ? "glass-button-active" : "glass-button"
                  }`}
                >
                  <Bell className="h-3.5 w-3.5" />
                  <span>Simulators</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-rose-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center border border-white/20">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </nav>
            </div>

            {/* Profile Info & Logout */}
            <div className="hidden md:flex items-center space-x-4" id="header_profile_action">
              <div className="flex items-center space-x-3 bg-white/5 border border-white/10 px-3 py-1.5 rounded-2xl">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-400 flex items-center justify-center text-white font-extrabold font-display text-sm">
                  {profile.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{profile.displayName}</div>
                  <div className="flex items-center space-x-1">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-cyan-400 font-mono">Lv. {profile.level}</span>
                    <span className="text-white/30">•</span>
                    <span className="text-[9px] text-white/50 font-mono">{profile.xp} XP</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2.5 bg-white/5 hover:bg-rose-500/20 text-white/60 hover:text-rose-400 rounded-xl transition border border-white/10 cursor-pointer"
                title="Log Out Scholar"
                id="btn_logout_desktop"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>

            {/* Mobile menu toggle */}
            <div className="flex items-center md:hidden" id="mobile_menu_toggle">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-white/60 hover:bg-white/5 rounded-xl transition"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Panel */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/10 bg-slate-950/95 backdrop-blur-2xl"
              id="mobile_nav_panel"
            >
              <div className="px-4 py-3 space-y-1.5">
                <button
                  onClick={() => { setActiveTab("dashboard"); setSelectedTopic(null); setMobileMenuOpen(false); }}
                  className={`w-full text-left px-4 py-3 text-sm font-semibold rounded-xl transition flex items-center space-x-3 ${
                    activeTab === "dashboard" ? "bg-white/15 text-cyan-400 border border-white/10" : "text-white/60 hover:bg-white/5"
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Learning Desk</span>
                </button>
                <button
                  onClick={() => { setActiveTab("quiz"); setMobileMenuOpen(false); }}
                  className={`w-full text-left px-4 py-3 text-sm font-semibold rounded-xl transition flex items-center space-x-3 ${
                    activeTab === "quiz" ? "bg-white/15 text-cyan-400 border border-white/10" : "text-white/60 hover:bg-white/5"
                  }`}
                >
                  <Brain className="h-4 w-4" />
                  <span>Adaptive Challenge</span>
                </button>
                <button
                  onClick={() => { setActiveTab("leaderboard"); setMobileMenuOpen(false); }}
                  className={`w-full text-left px-4 py-3 text-sm font-semibold rounded-xl transition flex items-center space-x-3 ${
                    activeTab === "leaderboard" ? "bg-white/15 text-cyan-400 border border-white/10" : "text-white/60 hover:bg-white/5"
                  }`}
                >
                  <Trophy className="h-4 w-4" />
                  <span>Scholar Rankings</span>
                </button>
                <button
                  onClick={() => { setActiveTab("reminders"); setMobileMenuOpen(false); }}
                  className={`w-full text-left px-4 py-3 text-sm font-semibold rounded-xl transition flex items-center space-x-3 relative ${
                    activeTab === "reminders" ? "bg-white/15 text-cyan-400 border border-white/10" : "text-white/60 hover:bg-white/5"
                  }`}
                >
                  <Bell className="h-4 w-4" />
                  <span>Simulators</span>
                  {unreadCount > 0 && (
                    <span className="ml-2 w-4.5 h-4.5 bg-rose-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <div className="border-t border-white/10 pt-3 mt-3 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-400 flex items-center justify-center text-white font-extrabold font-display text-sm">
                      {profile.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{profile.displayName}</div>
                      <div className="text-[10px] text-cyan-400 font-mono font-semibold">Lv. {profile.level}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="p-2 bg-white/5 text-white/60 hover:text-rose-400 border border-white/10 rounded-xl transition"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Body container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10" id="primary_body">
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <Dashboard 
                profile={profile} 
                attempts={attempts} 
                onStartQuiz={(topic) => {
                  setSelectedTopic(topic);
                  setActiveTab("quiz");
                }} 
                onUpdateFieldOfStudy={handleUpdateFieldOfStudy}
              />
            </motion.div>
          )}

          {activeTab === "quiz" && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <QuizDesk 
                profile={profile} 
                attempts={attempts}
                activeTopic={selectedTopic} 
                onSelectTopic={setSelectedTopic} 
                onQuizSubmit={handleQuizSubmit} 
              />
            </motion.div>
          )}

          {activeTab === "leaderboard" && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <Leaderboard currentUserId={profile.userId} />
            </motion.div>
          )}

          {activeTab === "reminders" && (
            <motion.div
              key="reminders"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <Reminders 
                profile={profile} 
                reminders={reminders} 
                onAddReminder={handleAddReminder} 
                onClearReminders={handleClearReminders} 
                onNavigateToQuiz={(topic) => {
                  setSelectedTopic(TOPICS[0]);
                  setActiveTab("quiz");
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-slate-950/40 border-t border-white/10 py-6" id="primary_footer">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-white/40 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span>&copy; 2026 TutorCloud Adaptive Learning Systems</span>
          <div className="flex space-x-4">
            <span className="font-mono text-cyan-400/60">Serverless Gemini Engine</span>
            <span>•</span>
            <span className="font-mono text-indigo-400/60">Zero-Cold-Start DB</span>
          </div>
        </div>
      </footer>

      {unlockedBadgesToAnimate.length > 0 && (
        <BadgeUnlockModal
          badgeKeys={unlockedBadgesToAnimate}
          onClose={(badgeKey) => {
            setUnlockedBadgesToAnimate((prev) => prev.filter((b) => b !== badgeKey));
          }}
        />
      )}
    </div>
  );
}
