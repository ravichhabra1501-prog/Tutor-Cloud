import React, { useState, useEffect } from "react";
import { StudentProfile, QuizAttempt, TOPICS, FIELD_TOPICS } from "../types";
import BadgeShowcase from "./BadgeShowcase";
import { 
  Award, 
  Flame, 
  TrendingUp, 
  Compass, 
  Sparkles, 
  Calendar, 
  ChevronRight, 
  BookOpen, 
  GraduationCap, 
  HelpCircle,
  Download,
  CheckCircle2,
  Bookmark,
  ShieldAlert,
  Sliders,
  Sparkle,
  Activity
} from "lucide-react";
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from "recharts";
import { motion } from "motion/react";

interface DashboardProps {
  profile: StudentProfile;
  attempts: QuizAttempt[];
  onStartQuiz: (topic: string) => void;
  onUpdateFieldOfStudy?: (fieldOfStudy: string) => void;
}

export default function Dashboard({ profile, attempts, onStartQuiz, onUpdateFieldOfStudy }: DashboardProps) {
  const [selectedField, setSelectedField] = useState<string>("All");
  const [listSearch, setListSearch] = useState<string>("");
  const [activeChartTab, setActiveChartTab] = useState<"xp" | "elo">("xp");

  // Keep selectedField in sync when profile field of study changes
  useEffect(() => {
    if (profile.fieldOfStudy) {
      setSelectedField(profile.fieldOfStudy);
    }
  }, [profile.fieldOfStudy]);

  // Calculate average ELO per field/stream
  const getFieldAverageElo = (field: string) => {
    const topics = FIELD_TOPICS[field] || [];
    if (topics.length === 0) return 1000;
    const total = topics.reduce((sum, topic) => sum + (profile.topicMastery?.[topic] || 1000), 0);
    return Math.round(total / topics.length);
  };

  const getMappedScore = (rating: number) => {
    // Map ELO rating (500 to 1800) to a score scale of 0 to 100 for better display on Radar
    return Math.min(100, Math.max(10, Math.round(((rating - 500) / 1300) * 100)));
  };

  // Setup data for Radar Chart based on topicMastery ELO ratings
  const radarData = selectedField === "All"
    ? Object.keys(FIELD_TOPICS).map((field) => {
        const avgElo = getFieldAverageElo(field);
        return {
          subject: field,
          Mastery: getMappedScore(avgElo),
          fullMark: 100,
          elo: avgElo
        };
      })
    : (FIELD_TOPICS[selectedField] || []).map((topic) => {
        const rating = profile.topicMastery?.[topic] || 1000;
        let shortName = topic;
        if (topic.includes("&")) shortName = topic.split("&")[0].trim();
        if (topic.includes("HTML")) shortName = "Web Styling";
        if (shortName.length > 20) shortName = shortName.slice(0, 18) + "...";

        return {
          subject: shortName,
          Mastery: getMappedScore(rating),
          fullMark: 100,
          elo: rating
        };
      });

  // Calculate stats for the selected perspective
  const currentTopics = selectedField === "All"
    ? TOPICS
    : (FIELD_TOPICS[selectedField] || []);

  const ratings = currentTopics.map((topic) => profile.topicMastery?.[topic] || 1000);
  const avgRating = ratings.length > 0 ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length) : 1000;
  const maxRating = ratings.length > 0 ? Math.max(...ratings) : 1000;
  const minRating = ratings.length > 0 ? Math.min(...ratings) : 1000;

  const filteredCurrentTopics = [...currentTopics]
    .sort((a, b) => {
      const ratingA = profile.topicMastery?.[a] || 1000;
      const ratingB = profile.topicMastery?.[b] || 1000;
      return ratingB - ratingA;
    })
    .filter((topic) =>
      topic.toLowerCase().includes(listSearch.toLowerCase())
    )
    .slice(0, 5);

  // Calculate some analytics
  const totalXPToNextLevel = 100;
  const currentXPProgress = profile.xp % 100;
  const progressPercent = Math.min(100, Math.max(0, (currentXPProgress / totalXPToNextLevel) * 100));

  // Generate historical XP and ELO data for Recharts
  const progressData = React.useMemo(() => {
    if (attempts.length === 0) {
      // Generate beautiful mock historical points leading up to the current state
      const data = [];
      const now = new Date();
      const currentAvgElo = avgRating;
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const ratio = (6 - i) / 6; // from 1/6 to 1.0
        data.push({
          name: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          XP: Math.round(profile.xp * ratio),
          ELO: Math.round(1000 + (currentAvgElo - 1000) * ratio),
          isSimulated: true
        });
      }
      return data;
    } else {
      // Reconstruct chronologically
      const sorted = [...attempts].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      const data = [];
      
      // Start point
      let tempXP = Math.max(0, profile.xp - sorted.reduce((sum, a) => sum + a.xpGained, 0));
      let tempEloSum = TOPICS.length * 1000;
      const topicEloMap: Record<string, number> = {};
      TOPICS.forEach(t => { topicEloMap[t] = 1000; });

      data.push({
        name: "Start",
        XP: tempXP,
        ELO: 1000,
        isSimulated: false
      });

      sorted.forEach((attempt, index) => {
        tempXP += attempt.xpGained;
        const prevElo = topicEloMap[attempt.topic] || 1000;
        topicEloMap[attempt.topic] = prevElo + attempt.eloDelta;
        tempEloSum += attempt.eloDelta;
        
        const dateObj = new Date(attempt.timestamp);
        data.push({
          name: dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          XP: tempXP,
          ELO: Math.round(tempEloSum / TOPICS.length),
          topic: attempt.topic,
          topicElo: topicEloMap[attempt.topic],
          isSimulated: false
        });
      });

      return data;
    }
  }, [attempts, profile.xp, avgRating]);

  // Heatmap generation based on attempts & ELO mastery
  const getMasteryColor = (elo: number) => {
    if (elo < 900) return "bg-rose-500/10 text-rose-300 border-rose-500/20"; // Novice
    if (elo < 1100) return "bg-amber-500/10 text-amber-300 border-amber-500/20"; // Competent
    if (elo < 1300) return "bg-cyan-500/10 text-cyan-300 border-cyan-500/20"; // Proficient
    return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"; // Expert
  };

  const getEloLabel = (elo: number) => {
    if (elo < 950) return "Novice";
    if (elo < 1150) return "Competent";
    if (elo < 1350) return "Proficient";
    return "Expert";
  };

  const handleDownloadReport = () => {
    const dateStr = new Date().toLocaleDateString();
    const timeStr = new Date().toLocaleTimeString();

    const topicEntries = Object.entries(profile.topicMastery || {});
    let topTopicName = "None yet";
    let topTopicRating = 0;
    let weakestTopicName = "None yet";
    let weakestTopicRating = 9999;

    if (topicEntries.length > 0) {
      topicEntries.forEach(([topic, elo]) => {
        if (elo > topTopicRating) {
          topTopicRating = elo;
          topTopicName = topic;
        }
        if (elo < weakestTopicRating) {
          weakestTopicRating = elo;
          weakestTopicName = topic;
        }
      });
    }

    let reportMarkdown = `
# TutorCloud Academic Progress & Skill Growth Report
**Generated on:** ${dateStr} at ${timeStr}

## 1. Scholar Profile Summary
- **Scholar Name:** ${profile.displayName}
- **Current Level:** Lv. ${profile.level} (Total XP: ${profile.xp} XP)
- **Primary Field of Study:** ${profile.fieldOfStudy || "Engineering"}
- **Current Study Streak:** ${profile.streakDays} Day(s)
- **Account Created:** ${profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "N/A"}

---

## 2. Skill Mastery Spectrum (ELO Ratings)
Your learning difficulty dynamically adjusts with ELO ratings. Here is your current spectrum:

| Topic | Current ELO Rating | Proficiency Tier |
| :--- | :---: | :--- |
${TOPICS.map((topic) => {
  const rating = profile.topicMastery?.[topic] || 1000;
  const label = getEloLabel(rating);
  return `| ${topic} | ${rating} ELO | ${label} |`;
}).join("\n")}

---

## 3. Academic Badges & Credentials Earned
${profile.badges && profile.badges.length > 0 
  ? profile.badges.map((badgeId) => `- 🏆 **${badgeId}**`).join("\n") 
  : "*No badges earned yet. Complete more exercises with high accuracy to unlock unique badges!*"}

---

## 4. Detailed Quiz History & Adaptive Trajectory
Below are the details of your recent quiz submissions and adaptive shifts:

${attempts.length === 0 
  ? "*No quiz attempts recorded yet.*" 
  : `| Topic | Difficulty | Score | ELO Shift | XP Gained | Date Completed |
| :--- | :---: | :---: | :---: | :---: | :--- |
${attempts.map((attempt) => {
  const formattedDate = new Date(attempt.timestamp).toLocaleDateString();
  const formattedTime = new Date(attempt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const eloSign = attempt.eloDelta >= 0 ? "+" : "";
  return `| ${attempt.topic} | ${attempt.difficulty} | ${attempt.score}/${attempt.totalQuestions} (${attempt.percentage}%) | ${eloSign}${attempt.eloDelta} ELO | +${attempt.xpGained} XP | ${formattedDate} at ${formattedTime} |`;
}).join("\n")}`}

---

## 5. Personalized Adaptive Insights
- **Current Focus:** Based on your chosen field of "${profile.fieldOfStudy || "Engineering"}", TutorCloud's adaptive generator will contextualize quiz items with relevant professional analogies and application scenarios.
- **Top Performing Topic:** ${topTopicName} (${topTopicRating} ELO)
- **Area for Growth:** ${weakestTopicName} (${weakestTopicRating} ELO)

---
*Keep practicing to further calibrate the adaptive model and level up your proficiency spectrum!*
`;

    const blob = new Blob([reportMarkdown.trim()], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `tutorcloud_${profile.displayName.toLowerCase().replace(/\\s+/g, "_")}_report.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8" id="dashboard_panel">
      {/* Welcome & Profile Summary Banner */}
      <div className="glass-panel p-6 md:p-8 text-white relative overflow-hidden shadow-xl" id="dashboard_banner">
        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-cyan-500/10 rounded-full filter blur-[120px] pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-indigo-500/10 rounded-full filter blur-[80px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6" id="dashboard_banner_content">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 text-sm font-medium mb-2">
              <Sparkles className="h-4 w-4" />
              <span>Welcome Back, Scholar</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight mb-2">
              {profile.displayName}
            </h2>
            <p className="text-white/60 text-sm max-w-md leading-relaxed">
              Your personalized learning trajectory is primed. Complete quizzes to adapt difficulty and conquer your weak topics.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                id="btn_download_report"
                onClick={handleDownloadReport}
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-cyan-500/10 cursor-pointer border border-white/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Report</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4" id="dashboard_banner_stats">
            <div className="bg-white/5 px-5 py-4 rounded-2xl border border-white/10 flex items-center space-x-4">
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-cyan-400">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-white/40 font-medium">Scholar Level</div>
                <div className="text-xl font-bold font-display text-white">Lv. {profile.level}</div>
                <div className="text-[10px] text-white/40 font-mono">{profile.xp} Total XP</div>
              </div>
            </div>

            <div className="bg-white/5 px-5 py-4 rounded-2xl border border-white/10 flex items-center space-x-4">
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-rose-400">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-white/40 font-medium">Study Streak</div>
                <div className="text-xl font-bold font-display text-white">{profile.streakDays} Days</div>
                <div className="text-[10px] text-white/40">Level up streak at 3+ days!</div>
              </div>
            </div>

            <div className="bg-white/5 px-5 py-4 rounded-2xl border border-white/10 flex items-center space-x-4">
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-amber-400">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-white/40 font-medium">Primary Focus</div>
                <select
                  value={profile.fieldOfStudy || "Engineering"}
                  onChange={(e) => onUpdateFieldOfStudy?.(e.target.value)}
                  className="bg-transparent text-white font-bold font-display text-base outline-none cursor-pointer border-b border-dashed border-white/20 hover:border-white/60 transition pr-2"
                  style={{ colorScheme: "dark" }}
                >
                  <option value="Engineering" className="bg-[#0c1224] text-white">Engineering</option>
                  <option value="Medical" className="bg-[#0c1224] text-white">Medical</option>
                  <option value="Commerce" className="bg-[#0c1224] text-white">Commerce</option>
                  <option value="Technology" className="bg-[#0c1224] text-white">Technology</option>
                  <option value="Other" className="bg-[#0c1224] text-white">Other</option>
                </select>
                <div className="text-[10px] text-white/40">Select academic stream</div>
              </div>
            </div>
          </div>
        </div>

        {/* Level Up Progress Slider */}
        <div className="relative z-10 mt-6 pt-6 border-t border-white/10" id="xp_progress_bar">
          <div className="flex justify-between text-xs font-semibold text-white/60 mb-2">
            <span>XP progress to Level {profile.level + 1}</span>
            <span className="font-mono">{currentXPProgress} / {totalXPToNextLevel} XP</span>
          </div>
          <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8 }}
              className="h-full bg-gradient-to-r from-violet-600 to-cyan-400 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Dynamic Stream Explorer Tab Bar */}
      <div className="bg-gradient-to-r from-slate-950/80 via-slate-900/60 to-slate-950/80 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between" id="dashboard_stream_explorer">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-cyan-400/15 border border-cyan-400/20 text-cyan-400 rounded-xl">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center space-x-1.5">
              <span>Curriculum Explorer</span>
              <span className="text-[10px] bg-cyan-400/10 text-cyan-300 px-2 py-0.5 rounded-full font-mono uppercase font-semibold">Interactive</span>
            </h4>
            <p className="text-[11px] text-white/40 leading-relaxed">Toggle academic streams to inspect the ELO difficulty spectrum and customized focus curriculums</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5" id="explorer_filter_tabs">
          {["All", "Medical", "Commerce", "Engineering", "Technology", "Other"].map((field) => {
            const isActive = selectedField === field;
            return (
              <button
                key={field}
                onClick={() => {
                  setSelectedField(field);
                  setListSearch("");
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition duration-200 cursor-pointer ${
                  isActive 
                    ? "bg-cyan-400 text-slate-950 border-cyan-400 font-extrabold shadow-md shadow-cyan-400/10" 
                    : "bg-white/5 text-white/60 border-white/5 hover:bg-white/10 hover:text-white"
                }`}
                id={`explorer_tab_${field.toLowerCase()}`}
              >
                {field === "All" ? "All Streams" : field}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of ELO radar chart and heatmap details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in" id="dashboard_grid_analytics">
        {/* Radar Map */}
        <div className="lg:col-span-5 glass-panel p-6 flex flex-col justify-between" id="mastery_radar_card">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-display font-bold text-white mb-1 flex items-center space-x-2">
                  <Compass className="h-5 w-5 text-cyan-400 animate-spin-slow" />
                  <span>Skill Mastery Spectrum</span>
                </h3>
                <span className="text-[9px] bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full font-mono text-cyan-300 font-bold uppercase tracking-wider">
                  {selectedField === "All" ? "Global Overview" : selectedField}
                </span>
              </div>
              <p className="text-xs text-white/40 font-medium">Normalized ELO difficulty mapping across key topics</p>
            </div>

            {/* Quick Metrics Subgrid */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950/40 border border-white/5 p-3 rounded-2xl text-center">
              <div>
                <div className="text-[9px] text-white/40 uppercase font-bold font-mono tracking-wider">Avg ELO</div>
                <div className="text-sm font-extrabold text-cyan-400 mt-0.5 font-mono">{avgRating}</div>
              </div>
              <div>
                <div className="text-[9px] text-white/40 uppercase font-bold font-mono tracking-wider">Peak</div>
                <div className="text-sm font-extrabold text-emerald-400 mt-0.5 font-mono">{maxRating}</div>
              </div>
              <div>
                <div className="text-[9px] text-white/40 uppercase font-bold font-mono tracking-wider">Base</div>
                <div className="text-sm font-extrabold text-amber-400 mt-0.5 font-mono">{minRating}</div>
              </div>
            </div>
          </div>

          <div className="h-[230px] w-full flex items-center justify-center my-4" id="radar_chart_container">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="rgba(255, 255, 255, 0.08)" />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fill: "rgba(255, 255, 255, 0.6)", fontSize: 9, fontWeight: 500 }} 
                />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[0, 100]} 
                  tick={{ fill: "rgba(255, 255, 255, 0.4)", fontSize: 8 }}
                />
                <Radar
                  name="Mastery"
                  dataKey="Mastery"
                  stroke="#22d3ee"
                  fill="#22d3ee"
                  fillOpacity={0.15}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-4 border-t border-white/5 flex flex-col gap-2">
            <div className="text-[10px] text-white/40 flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-pulse"></span>
                <span>Mastery Progress (Scaled 0-100)</span>
              </div>
              <span className="font-mono text-[9px] text-white/30">Auto-calibrated</span>
            </div>
            
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 text-[10px] text-white/60 leading-normal flex items-center space-x-2">
              <Sparkle className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0 animate-pulse" />
              <span>
                {selectedField === "All" 
                  ? "Toggle specific streams in the explorer tab above to zoom in on specific topics."
                  : `Your ${selectedField} spectrum stands at ${getEloLabel(avgRating)} tier with average ELO ${avgRating}.`}
              </span>
            </div>
          </div>
        </div>

        {/* Heatmap & Topic Mastery Details */}
        <div className="lg:col-span-7 glass-panel p-6 flex flex-col justify-between" id="mastery_heatmap_card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-lg font-display font-bold text-white mb-1 flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-cyan-400" />
                <span>Topic Mastery Grid</span>
                <span className="text-[10px] bg-cyan-400/15 border border-cyan-400/20 text-cyan-300 px-2 py-0.5 rounded-full font-mono font-bold">Top 5</span>
              </h3>
              <p className="text-xs text-white/40">Top 5 performance ratings calculated by TutorCloud Adaptive Engine</p>
            </div>
            {/* Elegant Search Input */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search topics..."
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:border-cyan-400/60 transition"
              />
              {listSearch && (
                <button
                  onClick={() => setListSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 text-xs font-semibold cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1" id="topic_mastery_list">
            {filteredCurrentTopics.length === 0 ? (
              <div className="text-center py-12 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center justify-center">
                <BookOpen className="h-8 w-8 text-white/10 mb-2" />
                <p className="text-xs text-white/40">No matching topics found in this stream.</p>
              </div>
            ) : (
              filteredCurrentTopics.map((topic) => {
                const rating = profile.topicMastery?.[topic] || 1000;
                const masteryColor = getMasteryColor(rating);
                const eloLabel = getEloLabel(rating);

                return (
                  <div 
                    key={topic} 
                    className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-cyan-400/5 text-cyan-400 rounded-xl border border-cyan-400/10 font-bold text-xs font-mono w-9 h-9 flex items-center justify-center">
                        {topic.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">{topic}</h4>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="text-[10px] font-mono text-white/40">Current Rating:</span>
                          <span className="text-xs font-bold text-cyan-400 font-mono glow-cyan">{rating} ELO</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${masteryColor}`}>
                        {eloLabel}
                      </span>
                      <button
                        onClick={() => onStartQuiz(topic)}
                        className="px-4 py-2 glow-btn-cyan text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                      >
                        <span>Practice</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Trajectory Progress Visualization */}
      <div className="glass-panel p-6 shadow-xl relative overflow-hidden" id="scholar_trajectory_card">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full filter blur-[100px] pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-display font-bold text-white mb-1 flex items-center space-x-2">
              <Activity className="h-5 w-5 text-cyan-400 animate-pulse" />
              <span>Scholar Progress Trajectory</span>
              {attempts.length === 0 && (
                <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wide">
                  Baseline Profile
                </span>
              )}
            </h3>
            <p className="text-xs text-white/40">
              Track your dynamic difficulty shifts and XP accumulations over time
            </p>
          </div>

          {/* Tab Toggles */}
          <div className="flex items-center space-x-1.5 bg-slate-950/60 p-1 rounded-xl border border-white/5" id="trajectory_tab_toggles">
            <button
              onClick={() => setActiveChartTab("xp")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition duration-200 cursor-pointer flex items-center space-x-1.5 ${
                activeChartTab === "xp"
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/10 font-extrabold"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
              id="btn_tab_xp"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>XP Growth</span>
            </button>
            <button
              onClick={() => setActiveChartTab("elo")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition duration-200 cursor-pointer flex items-center space-x-1.5 ${
                activeChartTab === "elo"
                  ? "bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md shadow-cyan-600/10 font-extrabold"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
              id="btn_tab_elo"
            >
              <Award className="h-3.5 w-3.5" />
              <span>ELO Trend</span>
            </button>
          </div>
        </div>

        {attempts.length === 0 && (
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 mb-6 text-xs text-amber-300/80 leading-relaxed flex items-start space-x-2.5">
            <span className="text-amber-400 mt-0.5 text-sm">💡</span>
            <span>
              <strong>Calibration Baseline:</strong> You have not completed any quizzes yet. Showing the standard academic onboarding trajectory. Take an adaptive quiz in any stream above to start mapping your live, real-time ELO and experience progress!
            </span>
          </div>
        )}

        <div className="h-[300px] w-full" id="trajectory_chart_container">
          <ResponsiveContainer width="100%" height="100%">
            {activeChartTab === "xp" ? (
              <AreaChart data={progressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: "rgba(255, 255, 255, 0.4)", fontSize: 10, fontWeight: 500 }}
                  axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
                  tickLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
                />
                <YAxis 
                  tick={{ fill: "rgba(255, 255, 255, 0.4)", fontSize: 10, fontWeight: 500 }}
                  axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
                  tickLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#0b1329] border border-white/15 px-3 py-2.5 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="text-white/40 font-mono text-[10px]">{data.name}</p>
                          <p className="text-white font-bold font-display text-sm">
                            <span className="text-violet-400">{payload[0].value}</span> <span className="text-[11px] font-normal text-white/50">Total XP</span>
                          </p>
                          {data.topic && (
                            <p className="text-[11px] text-cyan-300 leading-normal border-t border-white/5 pt-1 mt-1 max-w-[200px]">
                              Topic: {data.topic}
                            </p>
                          )}
                          {data.isSimulated && (
                            <p className="text-[9px] text-amber-400 font-mono">Simulated Baseline</p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="XP" 
                  stroke="#8b5cf6" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#xpGrad)" 
                />
              </AreaChart>
            ) : (
              <AreaChart data={progressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="eloGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: "rgba(255, 255, 255, 0.4)", fontSize: 10, fontWeight: 500 }}
                  axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
                  tickLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
                />
                <YAxis 
                  domain={["auto", "auto"]}
                  tick={{ fill: "rgba(255, 255, 255, 0.4)", fontSize: 10, fontWeight: 500 }}
                  axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
                  tickLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#0b1329] border border-white/15 px-3 py-2.5 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="text-white/40 font-mono text-[10px]">{data.name}</p>
                          <p className="text-white font-bold font-display text-sm">
                            <span className="text-cyan-400">{payload[0].value}</span> <span className="text-[11px] font-normal text-white/50">Average ELO</span>
                          </p>
                          {data.topic && (
                            <div className="text-[11px] text-white/70 leading-normal border-t border-white/5 pt-1.5 mt-1.5 space-y-0.5">
                              <p className="text-white font-medium">Topic: <span className="text-cyan-300">{data.topic}</span></p>
                              <p className="text-white/40 text-[10px]">Topic Calibration: <span className="text-cyan-400 font-mono font-bold">{data.topicElo} ELO</span></p>
                            </div>
                          )}
                          {data.isSimulated && (
                            <p className="text-[9px] text-amber-400 font-mono">Simulated Baseline</p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="ELO" 
                  stroke="#22d3ee" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#eloGrad)" 
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Badges Showcase Component */}
      <BadgeShowcase profile={profile} />

      {/* Quiz History log */}
      <div className="glass-panel p-6" id="history_card">
        <h3 className="text-lg font-display font-bold text-white mb-1 flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-cyan-400" />
          <span>Recent Activity History</span>
        </h3>
        <p className="text-xs text-white/40 mb-6">Logs of your completed assessment exercises and ELO tracking</p>

        {attempts.length === 0 ? (
          <div className="text-center py-10 bg-white/5 rounded-2xl border border-white/10" id="history_empty">
            <BookOpen className="h-8 w-8 text-white/20 mx-auto mb-2" />
            <p className="text-sm text-white/60 font-medium">No quiz attempts yet.</p>
            <p className="text-xs text-white/40 mt-1">Start a practice session above to begin your trajectory.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-white/10 rounded-2xl" id="history_table_wrapper">
            <table className="w-full text-left text-sm" id="history_table">
              <thead>
                <tr className="border-b border-white/10 text-xs font-semibold text-white/40 uppercase tracking-wider bg-white/5">
                  <th className="py-3 px-4">Topic</th>
                  <th className="py-3 px-4">Difficulty</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4 text-center">ELO Shift</th>
                  <th className="py-3 px-4 text-center">XP Gained</th>
                  <th className="py-3 px-4 text-right">Date Completed</th>
                </tr>
              </thead>
              <tbody>
                {attempts.slice(0, 5).map((attempt) => (
                  <tr key={attempt.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="py-4 px-4 font-semibold text-white">{attempt.topic}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        attempt.difficulty === "Beginner" 
                          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                          : attempt.difficulty === "Intermediate"
                          ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/20"
                          : "bg-violet-500/10 text-violet-300 border-violet-500/20"
                      }`}>
                        {attempt.difficulty}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-white/80 font-mono">
                      {attempt.score} / {attempt.totalQuestions} ({attempt.percentage}%)
                    </td>
                    <td className="py-4 px-4 text-center font-semibold">
                      <span className={attempt.eloDelta >= 0 ? "text-emerald-400 font-mono glow-cyan" : "text-rose-400 font-mono"}>
                        {attempt.eloDelta >= 0 ? "+" : ""}{attempt.eloDelta} ELO
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center font-medium text-white/60 font-mono">
                      +{attempt.xpGained} XP
                    </td>
                    <td className="py-4 px-4 text-right text-xs text-white/40 font-mono">
                      {new Date(attempt.timestamp).toLocaleDateString()} at {new Date(attempt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
