import React, { useState } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { BookOpen, Sparkles, Brain, GraduationCap, ChevronRight, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { TOPICS } from "../types";
import firebaseConfig from "../../firebase-applet-config.json";

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("Engineering");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showRestrictedInfo, setShowRestrictedInfo] = useState(false);

  // Initialize a new student profile in Firestore
  const initializeProfile = async (userId: string, userEmail: string, displayName: string, fieldOfStudyVal: string = "Engineering") => {
    // Default masteries: 1000 (intermediate ELO) for all topics
    const defaultMastery: Record<string, number> = {};
    TOPICS.forEach((topic) => {
      defaultMastery[topic] = 1000;
    });

    const newProfile = {
      userId,
      email: userEmail || "anonymous@tutorcloud.io",
      displayName: displayName || "Guest Scholar",
      xp: 0,
      level: 1,
      streakDays: 1,
      lastActiveDate: new Date().toISOString().split("T")[0],
      difficultyLevel: "Intermediate",
      badges: [],
      topicMastery: defaultMastery,
      createdAt: new Date().toISOString(),
      fieldOfStudy: fieldOfStudyVal
    };

    try {
      const profileRef = doc(db, "profiles", userId);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        await setDoc(profileRef, newProfile);

        // Create a leaderboard entry too
        await setDoc(doc(db, "leaderboard", userId), {
          userId,
          displayName: displayName || "Guest Scholar",
          xp: 0,
          level: 1
        });
      }
    } catch (error) {
      console.warn("Could not write/get profile from Firestore (possibly offline). Saving to offline storage:", error);
      const existingOffline = localStorage.getItem(`tutorcloud_offline_profile_${userId}`);
      if (!existingOffline) {
        localStorage.setItem(`tutorcloud_offline_profile_${userId}`, JSON.stringify(newProfile));
      }
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (isSignUp && !name) {
      setError("Please provide your name.");
      return;
    }

    setLoading(true);
    setError("");
    setShowRestrictedInfo(false);

    try {
      if (isSignUp) {
        // Sign Up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        await initializeProfile(userCredential.user.uid, email, name, fieldOfStudy);
      } else {
        // Log In
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const displayName = userCredential.user.displayName || "Scholar";
        await initializeProfile(userCredential.user.uid, email, displayName);
      }
      onAuthSuccess();
    } catch (err: any) {
      console.warn("Email Auth status:", err);
      if (err.code === "auth/admin-restricted-operation" || (err.message && err.message.includes("admin-restricted-operation"))) {
        setShowRestrictedInfo(true);
        setError("Admin restricted operation: Firebase authentication restriction detected.");
      } else {
        setError(err.message || "Authentication failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setLoading(true);
    setError("");
    setShowRestrictedInfo(false);
    try {
      const userCredential = await signInAnonymously(auth);
      const guestName = `Scholar_${Math.floor(1000 + Math.random() * 9000)}`;
      await updateProfile(userCredential.user, { displayName: guestName });
      await initializeProfile(userCredential.user.uid, "", guestName);
      onAuthSuccess();
    } catch (err: any) {
      console.warn("Guest Auth fell back gracefully to local sandbox mode:", err);
      const guestName = `Local_Scholar_${Math.floor(1000 + Math.random() * 9000)}`;
      const sandboxUser = {
        uid: `sandbox_${Math.floor(100000 + Math.random() * 900000)}`,
        email: "sandbox@tutorcloud.edu",
        displayName: guestName,
        isAnonymous: true
      };
      localStorage.setItem("tutorcloud_local_user", JSON.stringify(sandboxUser));
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  const handleLocalSandboxSignIn = () => {
    setLoading(true);
    setError("");
    try {
      const guestName = name.trim() || `Local_Scholar_${Math.floor(1000 + Math.random() * 9000)}`;
      const sandboxUser = {
        uid: `sandbox_${Math.floor(100000 + Math.random() * 900000)}`,
        email: "sandbox@tutorcloud.edu",
        displayName: guestName,
        isAnonymous: true
      };
      localStorage.setItem("tutorcloud_local_user", JSON.stringify(sandboxUser));
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      setError("Failed to start Local Sandbox Session.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    setShowRestrictedInfo(false);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const displayName = userCredential.user.displayName || "Scholar";
      await initializeProfile(userCredential.user.uid, userCredential.user.email || "", displayName);
      onAuthSuccess();
    } catch (err: any) {
      console.warn("Google sign-in status:", err);
      if (err.code === "auth/admin-restricted-operation" || (err.message && err.message.includes("admin-restricted-operation"))) {
        setShowRestrictedInfo(true);
        setError("Admin restricted operation: Firebase authentication restriction detected.");
      } else if (err.code === "auth/popup-closed-by-user") {
        setError("The Google Sign-In window was closed before completion. If popups are restricted or blocked in your browser's iframe, please use the 'Guest Scholar' or 'Local Sandbox' option below to access the full application instantly!");
      } else if (err.code === "auth/cancelled-popup-request") {
        setError("The authentication popup request was cancelled or blocked. For a guaranteed seamless experience within the preview iframe, try signing in with 'Guest Scholar' or bypass using the 'Local Sandbox' option below!");
      } else {
        setError(err.message || "Failed to sign in with Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans relative overflow-hidden" id="auth_container">
      {/* Mesh Gradient Atmospheric Backdrops */}
      <div className="absolute top-[-15%] left-[-5%] w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Visual left panel */}
      <div className="w-full md:w-1/2 bg-white/5 border-r border-white/10 backdrop-blur-2xl text-white flex flex-col justify-between p-8 md:p-16 relative overflow-hidden z-10" id="auth_visual_panel">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full filter blur-[150px] opacity-25"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-cyan-500/5 rounded-full filter blur-[120px] opacity-20"></div>

        <div className="relative z-10 flex items-center space-x-3" id="auth_logo">
          <div className="w-10 h-10 bg-gradient-to-tr from-violet-600 to-cyan-400 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-cyan-500/20 border border-white/20">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight">TutorCloud</span>
          <span className="text-[10px] bg-indigo-500/10 text-cyan-400 px-2.5 py-0.5 rounded-full font-mono border border-indigo-500/20">Adaptive Agent</span>
        </div>

        <div className="relative z-10 my-12 max-w-lg" id="auth_highlights">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight leading-tight mb-6">
              AI-Guided Mastery, <br />
              <span className="text-cyan-400 glow-cyan">Personalized in Real-Time</span>
            </h1>
            <p className="text-white/60 text-base mb-8 leading-relaxed">
              TutorCloud adapts quizzes based on your actual mastery, synthesizes personalized exercises using server-side Gemini intelligence, and tracks your trajectory dynamically.
            </p>
          </motion.div>

          <div className="space-y-4" id="auth_features_list">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-white/5 border border-white/10 text-cyan-400 rounded-xl mt-0.5">
                <Brain className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Adaptive ELO Difficulty Engine</h4>
                <p className="text-xs text-white/40">Recalculates topic mastery rating after each quiz, adjusting questions accordingly.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-white/5 border border-white/10 text-cyan-400 rounded-xl mt-0.5">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-semibold text-white">On-Demand Gemini Quiz Generation</h4>
                <p className="text-xs text-white/40">Auto-creates custom exercises matching your weak areas, never repeating the same set.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-white/5 border border-white/10 text-cyan-400 rounded-xl mt-0.5">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Gamified Trajectory Dashboard</h4>
                <p className="text-xs text-white/40">Earn XP, rank up on the real-time leaderboard, and unlock mastery achievement badges.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-white/30 flex justify-between border-t border-white/5 pt-6" id="auth_footer">
          <span>&copy; 2026 TutorCloud. All rights reserved.</span>
          <span>Powered by Gemini 3.5 Flash</span>
        </div>
      </div>

      {/* Auth form panel */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-16 bg-transparent z-10" id="auth_form_panel">
        <div className="w-full max-w-md glass-panel p-8 md:p-10 rounded-[2.5rem] shadow-2xl" id="auth_form_card">
          <div className="mb-8" id="auth_form_header">
            <h2 className="text-3xl font-display font-bold text-white mb-2">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h2>
            <p className="text-sm text-white/60">
              {isSignUp 
                ? "Start your personalized adaptive learning journey today." 
                : "Sign in to resume practicing and maintaining your streak."}
            </p>
          </div>

          {error && (
            <div className="p-4 mb-6 text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl" id="auth_error">
              <span className="font-semibold block mb-1">Authentication Error</span>
              <p className="text-xs text-rose-200/80 leading-relaxed">{error}</p>
              
              {showRestrictedInfo && (
                <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10 space-y-3" id="firebase_setup_help">
                  <p className="text-[11px] text-white/80 leading-normal">
                    Email/Password and Anonymous Authentication must be enabled in your Firebase project first.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <a
                      href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center text-[10px] bg-cyan-400 text-slate-950 font-bold px-2.5 py-1.5 rounded hover:bg-cyan-300 transition-colors font-mono uppercase"
                    >
                      Enable Providers in Console ↗
                    </a>
                    <button
                      type="button"
                      onClick={handleLocalSandboxSignIn}
                      className="inline-flex items-center justify-center text-[10px] bg-white/10 hover:bg-white/20 text-cyan-300 font-bold px-2.5 py-1.5 rounded border border-cyan-400/30 transition-colors font-mono uppercase cursor-pointer"
                    >
                      Bypass & Run Local Sandbox 🌌
                    </button>
                  </div>
                  <p className="text-[10px] text-white/40">
                    Alternatively, use the <strong className="text-cyan-300">Google Sign-In</strong> option below, which is already enabled and fully configured!
                  </p>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-5" id="auth_form">
            {isSignUp && (
              <>
                <div id="field_name">
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 glass-input rounded-xl text-white outline-none text-sm"
                  />
                </div>
                <div id="field_of_study_select">
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Primary Academic Need</label>
                  <select
                    value={fieldOfStudy}
                    onChange={(e) => setFieldOfStudy(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0d1527] border border-white/10 rounded-xl text-white outline-none text-sm cursor-pointer"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Medical">Medical</option>
                    <option value="Commerce">Commerce</option>
                    <option value="Technology">Technology</option>
                    <option value="Other">Other / General</option>
                  </select>
                </div>
              </>
            )}

            <div id="field_email">
              <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Email Address</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 glass-input rounded-xl text-white outline-none text-sm"
              />
            </div>

            <div id="field_password">
              <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 glass-input rounded-xl text-white outline-none text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 glow-btn-cyan flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              id="btn_submit_auth"
            >
              <span>{loading ? "Please wait..." : isSignUp ? "Sign Up" : "Log In"}</span>
              {!loading && <ChevronRight className="h-4 w-4" />}
            </button>
          </form>

          <div className="relative my-8" id="auth_divider">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0c1224] px-4 text-white/40 font-medium">Or experience instantly</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full mb-3 py-3.5 bg-white text-slate-950 hover:bg-slate-100 font-bold rounded-xl transition duration-200 flex items-center justify-center space-x-2 cursor-pointer shadow-md"
            id="btn_google_auth"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.29 1.5-.1.14-.14 3-.84 1.4-1.9 2.57-3.23 3.44v2.85h5.21c3.05-2.81 4.8-6.94 4.8-11.14z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-5.21-2.85c-.9.61-2.06.96-3.32.96-3.13 0-5.78-2.11-6.73-4.96H1.46v3.13C3.48 20.1 7.42 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.27 14.24A7.22 7.22 0 0 1 4.8 12c0-.79.13-1.57.38-2.31V6.56H1.46A11.94 11.94 0 0 0 0 12c0 2.05.52 4 1.46 5.75l3.81-2.51z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.96 1.19 15.24 0 12 0 7.42 0 3.48 3.9 1.46 7.72l3.81 2.84c.95-2.85 3.6-4.96 6.73-4.96z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <button
            type="button"
            onClick={handleGuestSignIn}
            disabled={loading}
            className="w-full mb-3 py-3.5 glass-button text-cyan-400 border border-white/10 font-bold rounded-xl transition duration-200 flex items-center justify-center space-x-2 cursor-pointer"
            id="btn_guest_auth"
          >
            <Sparkles className="h-4 w-4" />
            <span>⚡ Guest Scholar Quick Sign-In</span>
          </button>

          <button
            type="button"
            onClick={handleLocalSandboxSignIn}
            disabled={loading}
            className="w-full py-3.5 border border-cyan-400/30 bg-cyan-400/5 hover:bg-cyan-400/15 text-cyan-300 font-bold rounded-xl transition duration-200 flex items-center justify-center space-x-2 cursor-pointer"
            id="btn_sandbox_auth"
          >
            <span>🌌 Enter Local Sandbox (No-Auth Bypass)</span>
          </button>

          <p className="mt-8 text-center text-sm text-white/50" id="auth_toggle_mode">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer underline bg-transparent border-none"
            >
              {isSignUp ? "Log In" : "Sign up for free"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
