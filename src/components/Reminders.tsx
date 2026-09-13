import React, { useState } from "react";
import { StudentProfile, SimulatedReminder } from "../types";
import { 
  Bell, 
  Clock, 
  Play, 
  Trash2, 
  Compass, 
  TrendingUp, 
  Sparkles, 
  ExternalLink,
  Smartphone,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface RemindersProps {
  profile: StudentProfile;
  reminders: SimulatedReminder[];
  onAddReminder: (reminder: SimulatedReminder) => void;
  onClearReminders: () => void;
  onNavigateToQuiz: (topic: string) => void;
}

export default function Reminders({ profile, reminders, onAddReminder, onClearReminders, onNavigateToQuiz }: RemindersProps) {
  const [triggering, setTriggering] = useState(false);
  const [cronTime, setCronTime] = useState("Daily at 08:00 UTC (16h 47m remaining)");

  const handleTriggerScheduler = async () => {
    setTriggering(true);
    
    // Find weak topics (ELO < 1100) or default to standard topic
    const weakTopics = Object.entries(profile.topicMastery || {})
      .filter(([_, elo]) => elo < 1100)
      .map(([topic]) => topic);

    try {
      const response = await fetch("/api/reminders/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: profile.displayName,
          streakDays: profile.streakDays,
          weakTopics: weakTopics.length > 0 ? weakTopics : ["JavaScript Arrays"],
          badges: profile.badges
        })
      });

      if (!response.ok) throw new Error("Scheduler failed.");
      const data = await response.json();

      onAddReminder({
        id: `rem_${Date.now()}`,
        title: data.title,
        body: data.body,
        type: data.type,
        motivationalTip: data.motivationalTip,
        timestamp: new Date().toISOString(),
        isRead: false
      });
    } catch (error) {
      console.warn("Scheduler mockup error:", error);
      // Fallback
      onAddReminder({
        id: `rem_${Date.now()}`,
        title: "🔥 Study Streak Warning",
        body: `Scholar ${profile.displayName}, your ${profile.streakDays}-day streak is expiring in 4 hours!`,
        type: "streak_alert",
        motivationalTip: "Maintain high ELO rankings by completing one 2-minute assessment today.",
        timestamp: new Date().toISOString(),
        isRead: false
      });
    } finally {
      setTriggering(false);
    }
  };

  const getReminderBadge = (type: string) => {
    switch (type) {
      case "streak_alert":
        return <span className="bg-red-100 text-red-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">Streak At Risk</span>;
      case "new_exercise":
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">New Exercise</span>;
      default:
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">Inspire</span>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans" id="reminders_view">
      {/* Simulation controller */}
      <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between" id="reminders_setup_card">
        <div>
          <h3 className="text-lg font-display font-bold text-slate-900 mb-1 flex items-center space-x-2">
            <Smartphone className="h-5 w-5 text-indigo-500" />
            <span>FCM & Cron Scheduler Simulator</span>
          </h3>
          <p className="text-xs text-slate-400 mb-6">Manually trigger the background daemon to test real-time AI push notification generation</p>

          <div className="space-y-4 text-xs" id="simulation_status">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Cloud Scheduler Cron:</span>
                <span className="font-mono text-indigo-600 font-bold">ACTIVE</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Cron Schedule:</span>
                <span className="font-mono text-slate-700">0 8 * * * (Daily)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Next Run:</span>
                <span className="text-slate-600 font-medium">{cronTime}</span>
              </div>
            </div>

            <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100/30 text-indigo-900 leading-relaxed">
              <span className="font-semibold block mb-1 flex items-center space-x-1">
                <Sparkles className="h-3.5 w-3.5" />
                <span>How this works</span>
              </span>
              In production, a Cloud Scheduler triggers a serverless endpoint daily. Here, click below to immediately trigger the background service. Gemini parses the scholar's profile and writes a highly personalized study nudge.
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-50" id="scheduler_actions">
          <button
            onClick={handleTriggerScheduler}
            disabled={triggering}
            className="w-full py-3.5 bg-slate-950 hover:bg-slate-900 disabled:bg-slate-300 text-white font-medium rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            {triggering ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Executing Serverless Nudge...</span>
              </>
            ) : (
              <>
                <Bell className="h-4 w-4" />
                <span>Trigger Scheduled Reminders</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Received Push Messages list */}
      <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between" id="inbox_card">
        <div>
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
            <div>
              <h3 className="text-lg font-display font-bold text-slate-900 flex items-center space-x-2">
                <Bell className="h-5 w-5 text-indigo-500" />
                <span>Scholar Notification Center</span>
              </h3>
              <p className="text-xs text-slate-400">Push messages generated and delivered by the Adaptivity Daemon</p>
            </div>
            {reminders.length > 0 && (
              <button
                onClick={onClearReminders}
                className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition border border-slate-100 cursor-pointer"
                title="Clear Inbox"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          <AnimatePresence>
            {reminders.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-100" id="inbox_empty">
                <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500 font-medium">Your inbox is clear.</p>
                <p className="text-xs text-slate-400 mt-1">Click "Trigger Scheduled Reminders" to run simulation.</p>
              </div>
            ) : (
              <div className="space-y-4" id="inbox_list">
                {reminders.map((rem) => (
                  <motion.div
                    key={rem.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-slate-50 hover:bg-slate-100/75 border border-slate-100 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-2">
                        {getReminderBadge(rem.type)}
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(rem.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">{rem.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{rem.body}</p>
                      
                      {rem.motivationalTip && (
                        <div className="text-[10px] text-indigo-600 bg-indigo-50/50 px-2.5 py-1 rounded-lg border border-indigo-100/20 font-medium">
                          💡 Tip: {rem.motivationalTip}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => onNavigateToQuiz(profile.difficultyLevel)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition flex items-center space-x-1.5 shadow-sm shrink-0 w-full md:w-auto justify-center cursor-pointer"
                    >
                      <span>Study Now</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] text-slate-400" id="inbox_footer">
          <span>Simulation Mode: Active</span>
          <span>Delivered via FCM Service</span>
        </div>
      </div>
    </div>
  );
}
