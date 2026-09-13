import React, { useState, useEffect } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { LeaderboardEntry } from "../types";
import { Trophy, Medal, Crown, Star, Sparkles, BookOpen } from "lucide-react";
import { motion } from "motion/react";

interface LeaderboardProps {
  currentUserId: string;
}

export default function Leaderboard({ currentUserId }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isSandbox = currentUserId.startsWith("sandbox_");

    if (isSandbox) {
      // Simulate/retrieve offline high scores
      const loadSimulatedLeaderboard = () => {
        const defaultEntries = [
          { userId: "sim_1", displayName: "Ada Lovelace", xp: 1250, level: 13, fieldOfStudy: "Technology" },
          { userId: "sim_2", displayName: "Alan Turing", xp: 1100, level: 12, fieldOfStudy: "Engineering" },
          { userId: "sim_3", displayName: "Claude Shannon", xp: 950, level: 10, fieldOfStudy: "Engineering" },
          { userId: "sim_4", displayName: "Grace Hopper", xp: 820, level: 9, fieldOfStudy: "Technology" },
          { userId: "sim_5", displayName: "Richard Feynman", xp: 750, level: 8, fieldOfStudy: "Engineering" },
        ];

        // Read local storage leaderboard
        let localLeaderboard = JSON.parse(localStorage.getItem("tutorcloud_local_leaderboard") || "[]");
        
        // Find our entry or add our current entry if not exists
        const savedProfile = JSON.parse(localStorage.getItem("tutorcloud_local_profile") || "null");
        if (savedProfile) {
          const ourEntryIndex = localLeaderboard.findIndex((e: any) => e.userId === currentUserId);
          const ourEntry = {
            userId: currentUserId,
            displayName: savedProfile.displayName,
            xp: savedProfile.xp,
            level: savedProfile.level,
            fieldOfStudy: savedProfile.fieldOfStudy || "Engineering"
          };
          if (ourEntryIndex >= 0) {
            localLeaderboard[ourEntryIndex] = ourEntry;
          } else {
            localLeaderboard.push(ourEntry);
          }
          localStorage.setItem("tutorcloud_local_leaderboard", JSON.stringify(localLeaderboard));
        }

        // Merge defaults and user entry
        const merged = [...defaultEntries];
        localLeaderboard.forEach((localEntry: any) => {
          if (!merged.some(m => m.userId === localEntry.userId)) {
            merged.push(localEntry);
          } else {
            // update existing
            const idx = merged.findIndex(m => m.userId === localEntry.userId);
            merged[idx] = localEntry;
          }
        });

        // Sort by XP
        merged.sort((a, b) => b.xp - a.xp);
        setEntries(merged);
        setLoading(false);
      };

      loadSimulatedLeaderboard();
      return;
    }

    // Real-time listener for high score global rankings
    const leaderboardRef = collection(db, "leaderboard");
    const q = query(leaderboardRef, orderBy("xp", "desc"), limit(25));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: LeaderboardEntry[] = [];
      snapshot.forEach((doc) => {
        data.push(doc.data() as LeaderboardEntry);
      });
      setEntries(data);
      setLoading(false);
    }, (error) => {
      console.error("Leaderboard subscription error:", error);
      // Fallback on error to simulated entries
      const defaultEntries = [
        { userId: "sim_1", displayName: "Ada Lovelace", xp: 1250, level: 13 },
        { userId: "sim_2", displayName: "Alan Turing", xp: 1100, level: 12 },
        { userId: "sim_3", displayName: "Claude Shannon", xp: 950, level: 10 },
        { userId: "sim_4", displayName: "Grace Hopper", xp: 820, level: 9 },
      ];
      setEntries(defaultEntries);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 shadow-sm border border-amber-500/20">
            <Crown className="h-4 w-4" />
          </div>
        );
      case 2:
        return (
          <div className="w-8 h-8 rounded-full bg-slate-400/10 flex items-center justify-center text-slate-300 shadow-sm border border-slate-400/20">
            <Medal className="h-4 w-4" />
          </div>
        );
      case 3:
        return (
          <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 shadow-sm border border-orange-500/20">
            <Medal className="h-4 w-4" />
          </div>
        );
      default:
        return <span className="font-mono text-white/40 font-bold text-xs">{rank}</span>;
    }
  };

  return (
    <div className="glass-panel p-6 md:p-8" id="leaderboard_panel">
      <div className="border-b border-white/10 pb-5 mb-6" id="leaderboard_header">
        <h3 className="text-xl font-display font-bold text-white flex items-center space-x-2">
          <Trophy className="h-5 w-5 text-cyan-400" />
          <span>Global Scholar Leaderboard</span>
        </h3>
        <p className="text-xs text-white/40 mt-1">Real-time leaderboard synchronized via Firestore. Compete with global peers!</p>
      </div>

      {loading ? (
        <div className="text-center py-20" id="leaderboard_loading">
          <div className="relative w-10 h-10 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-white/5"></div>
            <div className="absolute inset-0 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin"></div>
          </div>
          <span className="text-xs text-white/40">Loading active ranks...</span>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10" id="leaderboard_empty">
          <BookOpen className="h-8 w-8 text-white/20 mx-auto mb-2" />
          <p className="text-sm text-white/60 font-medium">The leaderboard is empty.</p>
          <p className="text-xs text-white/40 mt-1">Be the first scholar to claim your rank!</p>
        </div>
      ) : (
        <div className="space-y-3" id="leaderboard_list">
          {entries.map((entry, index) => {
            const isSelf = entry.userId === currentUserId;
            const rank = index + 1;

            return (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`p-4 rounded-2xl border flex items-center justify-between transition ${
                  isSelf 
                    ? "bg-white/10 border-cyan-400/30 shadow-lg" 
                    : "bg-white/5 border-white/5 hover:bg-white/10"
                }`}
                id={`leaderboard_item_${entry.userId}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-8 flex items-center justify-center">
                    {getRankBadge(rank)}
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/5 rounded-xl border border-white/10 text-xs font-bold text-cyan-400 font-mono">
                      Lv. {entry.level || 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white flex flex-wrap items-center gap-1.5">
                        <span>{entry.displayName}</span>
                        {entry.fieldOfStudy && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                            entry.fieldOfStudy === "Medical"
                              ? "bg-rose-500/10 text-rose-300 border-rose-500/20"
                              : entry.fieldOfStudy === "Commerce"
                              ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                              : entry.fieldOfStudy === "Engineering"
                              ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/20"
                              : entry.fieldOfStudy === "Technology"
                              ? "bg-violet-500/10 text-violet-300 border-violet-500/20"
                              : "bg-slate-500/10 text-slate-300 border-slate-500/20"
                          }`}>
                            {entry.fieldOfStudy}
                          </span>
                        )}
                        {isSelf && (
                          <span className="text-[9px] bg-cyan-400 text-[#0c1224] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                            You
                          </span>
                        )}
                      </h4>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-cyan-400" />
                  <span className="font-mono font-bold text-sm text-white">{entry.xp} <span className="text-[10px] text-white/40 font-sans font-medium">XP</span></span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
