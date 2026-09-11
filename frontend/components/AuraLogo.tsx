import React from "react";

interface AuraLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

export default function AuraLogo({
  size = 36,
  showText = true,
  className = "",
  textClassName = "text-xl font-black tracking-wider text-white",
}: AuraLogoProps) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Aura Glowing Emblem */}
      <div
        className="relative flex items-center justify-center flex-shrink-0"
        style={{ width: size, height: size }}
      >
        {/* Ambient background glow */}
        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 opacity-40 blur-md -z-10 animate-pulse"
          style={{ animationDuration: "4s" }}
        />

        {/* Icon Container with Glass border */}
        <div
          className="w-full h-full rounded-2xl bg-zinc-950/80 border border-white/15 backdrop-blur-md flex items-center justify-center p-1.5 shadow-xl shadow-violet-950/50"
        >
          <svg
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <defs>
              <linearGradient id="aura-grad-main" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A855F7" />
                <stop offset="50%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
              <linearGradient id="aura-grad-ring" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#EC4899" />
                <stop offset="50%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#38BDF8" />
              </linearGradient>
              <filter id="aura-spark-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Orbiting Aura Halo Ring */}
            <circle
              cx="20"
              cy="20"
              r="17"
              stroke="url(#aura-grad-ring)"
              strokeWidth="1.5"
              strokeDasharray="4 2.5"
              className="opacity-70"
            />

            {/* Dynamic Swirling Field Arcs */}
            <path
              d="M7 26C8.5 15.5 16 8 26.5 7"
              stroke="url(#aura-grad-main)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M33 14C31.5 24.5 24 32 13.5 33"
              stroke="url(#aura-grad-ring)"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Futuristic 'A' Monogram */}
            <path
              d="M20 9L11.5 28.5H15.8L17.6 23.8H22.4L24.2 28.5H28.5L20 9ZM18.6 21L20 16.5L21.4 21H18.6Z"
              fill="url(#aura-grad-main)"
            />

            {/* AI Core Intelligence Spark */}
            <circle
              cx="20"
              cy="19"
              r="1.6"
              fill="#FFFFFF"
              filter="url(#aura-spark-glow)"
            />
          </svg>
        </div>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent font-black tracking-widest ${textClassName}`}>
              AURA
            </span>
            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
              AI
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
