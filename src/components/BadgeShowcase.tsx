import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { StudentProfile, BADGE_DETAILS } from "../types";
import { Award, Lock, Sparkles, Filter, CheckCircle2 } from "lucide-react";

interface BadgeShowcaseProps {
  profile: StudentProfile;
}

export default function BadgeShowcase({ profile }: BadgeShowcaseProps) {
  const [filter, setFilter] = useState<"all" | "earned" | "locked">("all");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const earnedBadges = profile.badges || [];
  const totalBadges = Object.keys(BADGE_DETAILS).length;
  const earnedCount = earnedBadges.length;
  const progressPercent = Math.round((earnedCount / totalBadges) * 100);

  // Filter badges based on state
  const filteredBadges = Object.entries(BADGE_DETAILS).filter(([badgeId]) => {
    const isUnlocked = earnedBadges.includes(badgeId);
    if (filter === "earned") return isUnlocked;
    if (filter === "locked") return !isUnlocked;
    return true;
  });

  // Stagger animation variants for parent and children
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <div className="glass-panel p-6" id="badge_showcase_section">
      {/* Header and Progress section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6" id="badge_showcase_header">
        <div>
          <h3 className="text-lg font-display font-bold text-white mb-1 flex items-center space-x-2">
            <Award className="h-5 w-5 text-cyan-400" />
            <span>Scholar Badge Showcase</span>
          </h3>
          <p className="text-xs text-white/40">
            Track and celebrate your academic accomplishments and adaptivity milestones
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center space-x-2 self-start md:self-center" id="badge_showcase_filters">
          <Filter className="h-3.5 w-3.5 text-white/40" />
          <div className="bg-white/5 p-1 rounded-xl border border-white/10 flex space-x-1">
            {(["all", "earned", "locked"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                  filter === type
                    ? "bg-cyan-500 text-slate-950 font-extrabold shadow-md shadow-cyan-500/10"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Track */}
      <div className="bg-white/5 p-4 rounded-2xl border border-white/10 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4" id="badge_showcase_progress">
        <div className="w-full md:w-1/3">
          <div className="flex justify-between text-xs font-semibold text-white/60 mb-2">
            <span className="flex items-center space-x-1">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>Showcase Completion</span>
            </span>
            <span className="font-mono text-cyan-300">{earnedCount} / {totalBadges} Badges</span>
          </div>
          <div className="w-full h-2 bg-slate-950/40 rounded-full overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full"
            />
          </div>
        </div>

        <div className="hidden md:block text-right">
          <span className="text-[10px] uppercase tracking-widest font-mono text-white/30 block mb-0.5">RANK STATUS</span>
          <span className="text-xs font-extrabold text-cyan-300 font-display">
            {progressPercent === 100
              ? "🏆 Grandmaster Scholar"
              : progressPercent >= 60
              ? "🌟 Elite Adaptor"
              : progressPercent >= 20
              ? "🌱 Aspiring Talent"
              : "🚀 Trainee Scholar"}
          </span>
        </div>
      </div>

      {/* Grid of Badges */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
        id="badge_showcase_grid"
      >
        <AnimatePresence mode="popLayout">
          {filteredBadges.map(([badgeId, details]) => {
            const isUnlocked = earnedBadges.includes(badgeId);

            return (
              <motion.div
                key={badgeId}
                layout
                variants={cardVariants}
                className={`relative overflow-hidden p-5 rounded-2xl border flex flex-col items-center text-center transition-all duration-300 cursor-pointer ${
                  isUnlocked
                    ? "bg-slate-900/50 border-white/10 shadow-lg hover:border-cyan-500/40"
                    : "bg-transparent border-white/5 opacity-40 hover:opacity-60"
                }`}
                onMouseEnter={() => setHoveredId(badgeId)}
                onMouseLeave={() => setHoveredId(null)}
                whileHover={{
                  scale: 1.05,
                  y: -4,
                  boxShadow: isUnlocked 
                    ? "0 10px 25px -5px rgba(34, 211, 238, 0.15)" 
                    : "0 10px 20px -10px rgba(255, 255, 255, 0.05)",
                }}
              >
                {/* Visual Accent for Hover */}
                {hoveredId === badgeId && isUnlocked && (
                  <motion.div
                    layoutId="glowBg"
                    className={`absolute inset-0 bg-gradient-to-br ${details.color} opacity-5 blur-xl pointer-events-none`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.08 }}
                    exit={{ opacity: 0 }}
                  />
                )}

                {/* Badge Icon Emblem */}
                <div className="relative mb-3.5" id={`badge_emblem_${badgeId}`}>
                  <motion.div
                    animate={
                      hoveredId === badgeId
                        ? { rotate: [0, -8, 8, -4, 4, 0], scale: 1.1 }
                        : { rotate: 0, scale: 1 }
                    }
                    transition={{ duration: 0.5 }}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg bg-gradient-to-br ${
                      isUnlocked ? details.color : "from-white/5 to-white/10 border border-white/10"
                    }`}
                  >
                    {isUnlocked ? details.icon : <Lock className="h-6 w-6 text-white/30" />}
                  </motion.div>

                  {/* Status Indicator Dot */}
                  {isUnlocked && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-emerald-500 border-2 border-slate-950 p-0.5 rounded-full"
                    >
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    </motion.div>
                  )}
                </div>

                {/* Badge Title */}
                <h4 className="font-display font-bold text-sm text-white tracking-tight" id={`badge_title_${badgeId}`}>
                  {details.title}
                </h4>

                {/* Unlocked Status Label */}
                <div className="mt-1" id={`badge_status_${badgeId}`}>
                  {isUnlocked ? (
                    <span className="text-[9px] uppercase tracking-widest font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Earned
                    </span>
                  ) : (
                    <span className="text-[9px] uppercase tracking-widest font-mono text-white/30 font-bold bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                      Locked
                    </span>
                  )}
                </div>

                {/* Dynamic Sliding Hover Details */}
                <motion.div
                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                  animate={
                    hoveredId === badgeId
                      ? { height: "auto", opacity: 1, marginTop: 12 }
                      : { height: 0, opacity: 0, marginTop: 0 }
                  }
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden w-full"
                  id={`badge_desc_wrapper_${badgeId}`}
                >
                  <div className="pt-2 border-t border-white/5">
                    <p className="text-[11px] text-white/60 leading-normal mb-1">{details.desc}</p>
                    {isUnlocked ? (
                      <p className="text-[9px] text-cyan-400 font-mono font-semibold flex items-center justify-center gap-1">
                        <Sparkles className="h-2.5 w-2.5" />
                        <span>Adaptivity Milestone Met</span>
                      </p>
                    ) : (
                      <p className="text-[9px] text-white/30 font-mono">
                        Keep practicing to unlock!
                      </p>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredBadges.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full text-center py-12 bg-white/5 rounded-2xl border border-white/10"
            id="badge_showcase_empty"
          >
            <Award className="h-10 w-10 text-white/20 mx-auto mb-2" />
            <p className="text-sm text-white/60 font-semibold">No badges fit this filter.</p>
            <p className="text-xs text-white/40 mt-1">
              {filter === "earned"
                ? "Go complete some exercises and strive for flawless attempts to earn your first badge!"
                : "Congratulations! You have unlocked all milestones."}
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
