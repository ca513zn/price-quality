"use client";

import { useTheme } from "@/components/ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const W = 64;
  const H = 30;
  const thumbR = 10;
  const padding = 5;
  const thumbCx = isDark ? W - padding - thumbR : padding + thumbR;

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      style={{
        position: "relative",
        overflow: "hidden",
        width: `${W}px`,
        height: `${H}px`,
        borderRadius: `${H}px`,
        border: "none",
        cursor: "pointer",
        background: isDark
          ? "linear-gradient(180deg, #1a1a2e, #16213e, #0f3460)"
          : "linear-gradient(180deg, #56b4f9, #7cc8f9, #a8dcfa)",
        transition: "background 0.5s ease",
        padding: 0,
        flexShrink: 0,
      }}
    >
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
      >
        {/* Stars (dark mode) */}
        {[
          { x: 12, y: 7, r: 1 },
          { x: 22, y: 5, r: 0.7 },
          { x: 30, y: 10, r: 1.1 },
          { x: 17, y: 16, r: 0.8 },
          { x: 8, y: 20, r: 0.7 },
          { x: 26, y: 22, r: 0.9 },
        ].map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill="#fff"
            style={{
              transition: `opacity 0.4s ease ${i * 0.04}s`,
              opacity: isDark ? 0.9 : 0,
            }}
          />
        ))}

        {/* Clouds (light mode) */}
        <g
          style={{
            transition: "opacity 0.4s ease, transform 0.5s ease",
            opacity: isDark ? 0 : 1,
            transform: isDark ? "translateX(8px)" : "translateX(0)",
          }}
        >
          <ellipse cx={44} cy={20} rx={7} ry={4} fill="rgba(255,255,255,0.9)" />
          <ellipse cx={40} cy={17} rx={5} ry={4} fill="rgba(255,255,255,0.95)" />
          <ellipse cx={48} cy={17} rx={6} ry={4.5} fill="rgba(255,255,255,0.85)" />
          <ellipse cx={44} cy={15} rx={4} ry={3} fill="white" />
        </g>

        {/* Thumb (sun / moon) */}
        <circle
          cx={thumbCx}
          cy={H / 2}
          r={thumbR}
          fill={isDark ? "#c8ccd4" : "#ffd43b"}
          style={{
            transition:
              "cx 0.5s cubic-bezier(0.4,0,0.2,1), fill 0.4s ease",
          }}
        />

        {/* Moon craters */}
        <circle
          cx={thumbCx - 2.5}
          cy={H / 2 - 3}
          r={2}
          fill={isDark ? "#a0a5b0" : "transparent"}
          style={{ transition: "fill 0.3s ease" }}
        />
        <circle
          cx={thumbCx + 3}
          cy={H / 2 + 2}
          r={1.6}
          fill={isDark ? "#a0a5b0" : "transparent"}
          style={{ transition: "fill 0.3s ease" }}
        />
        <circle
          cx={thumbCx - 1}
          cy={H / 2 + 4}
          r={1.2}
          fill={isDark ? "#a0a5b0" : "transparent"}
          style={{ transition: "fill 0.3s ease" }}
        />
      </svg>
    </button>
  );
}
