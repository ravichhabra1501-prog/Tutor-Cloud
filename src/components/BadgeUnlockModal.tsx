import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Trophy, Award, Check } from "lucide-react";
import { BADGE_DETAILS } from "../types";

interface BadgeUnlockModalProps {
  badgeKeys: string[];
  onClose: (badgeKey: string) => void;
}

export default function BadgeUnlockModal({ badgeKeys, onClose }: BadgeUnlockModalProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const activeKey = badgeKeys[currentIdx];
  const badge = activeKey ? BADGE_DETAILS[activeKey] : null;

  // Audio effect context (synthesizer or clean beep)
  useEffect(() => {
    if (activeKey) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Play celebratory chime
        const playTone = (freq: number, start: number, duration: number) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, start);
          
          gain.gain.setValueAtTime(0.15, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
          
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          
          osc.start(start);
          osc.stop(start + duration);
        };

        // Standard pleasant academic notification chime (arpeggio)
        const now = audioCtx.currentTime;
        playTone(523.25, now, 0.15); // C5
        playTone(659.25, now + 0.1, 0.15); // E5
        playTone(783.99, now + 0.2, 0.15); // G5
        playTone(1046.50, now + 0.3, 0.4); // C6
      } catch (e) {
        console.log("Audio not allowed yet or not supported", e);
      }
    }
  }, [activeKey]);

  if (!badge) return null;

  const handleClaim = () => {
    onClose(activeKey);
    if (currentIdx + 1 < badgeKeys.length) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  // Generate floating star coordinates for ambient backdrop animation
  const sparkles = Array.from({ length: 16 }).map((_, i) => ({
    id: i,
    x: Math.random() * 360 - 180,
    y: Math.random() * -200 - 50,
    delay: Math.random() * 0.4,
    size: Math.random() * 10 + 6,
  }));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="badge-unlock-overlay">
        {/* Backdrop glass blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          onClick={handleClaim}
        />

        {/* Celebrating card wrapper */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: -30 }}
          transition={{ type: "spring", damping: 15, stiffness: 140 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/95 p-8 text-center shadow-2xl shadow-emerald-500/10"
        >
          {/* Top colored ambient glow */}
          <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-gradient-to-r ${badge.color} opacity-20 blur-3xl pointer-events-none`} />

          {/* Sparkle generator */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {sparkles.map((s) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{
                  opacity: [0, 0.9, 0.9, 0],
                  scale: [0.3, 1, 1, 0.2],
                  x: s.x,
                  y: s.y,
                }}
                transition={{
                  duration: 2.2,
                  delay: s.delay,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
                className="absolute left-1/2 top-1/2 text-amber-400"
                style={{ width: s.size, height: s.size }}
              >
                ✦
              </motion.div>
            ))}
          </div>

          {/* Achievement header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold tracking-wider text-amber-400 uppercase mb-3"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Badge Unlocked!</span>
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          </motion.div>

          {/* Floating interactive icon sphere */}
          <motion.div
            initial={{ rotate: -15, scale: 0.5, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              damping: 10,
              stiffness: 100,
              delay: 0.25,
            }}
            className={`mx-auto w-28 h-28 rounded-full bg-gradient-to-tr ${badge.color} p-0.5 shadow-lg shadow-amber-500/5 mb-6 flex items-center justify-center relative`}
          >
            {/* Soft inner circle */}
            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-5xl relative z-10 selection:bg-transparent">
              {badge.icon}
            </div>
            
            {/* Radial pulse glow */}
            <div className={`absolute inset-0 rounded-full bg-gradient-to-tr ${badge.color} animate-ping opacity-30 z-0`} />
          </motion.div>

          {/* Badge Title & Description */}
          <motion.h3
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-bold text-white tracking-tight mb-2"
          >
            {badge.title}
          </motion.h3>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-slate-400 text-sm leading-relaxed px-4 mb-8"
          >
            {badge.desc}
          </motion.p>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <button
              onClick={handleClaim}
              id="btn-claim-badge"
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold py-3.5 px-6 rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/20 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 cursor-pointer"
            >
              <Check className="w-4 h-4 text-white" />
              <span>Claim Achievement</span>
            </button>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
