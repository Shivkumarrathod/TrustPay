import React from "react";

export const TrustPayLogo = ({
  className = "w-8 h-8",
  withText = false,
}: {
  className?: string;
  withText?: boolean;
}) => {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`relative flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="trustpay-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="50%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
            <linearGradient id="trustpay-shield-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#161B2E" />
              <stop offset="100%" stopColor="#0D101A" />
            </linearGradient>
            <filter id="trustpay-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Shield Outline */}
          <path
            d="M20 3L6 9V19C6 28 12 34.5 20 37C28 34.5 34 28 34 19V9L20 3Z"
            fill="url(#trustpay-shield-bg)"
            stroke="url(#trustpay-grad-1)"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Glowing Center Lock / Escrow Check */}
          <g filter="url(#trustpay-glow)">
            {/* Lock body */}
            <rect x="14" y="18" width="12" height="10" rx="2" fill="#10B981" />
            {/* Lock shackle */}
            <path
              d="M16 18V14C16 11.7909 17.7909 10 20 10C22.2091 10 24 11.7909 24 14V18"
              stroke="#06B6D4"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {/* Keyhole / Check mark */}
            <path
              d="M17.5 23L19.2 24.7L22.5 21.5"
              stroke="#000000"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </div>

      {withText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
              TRUST<span className="text-white">PAY</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-semibold border border-emerald-500/30">
              v1.0
            </span>
          </div>
          <span className="text-[11px] text-slate-400 tracking-wide font-medium">Decentralized Escrow Protocol</span>
        </div>
      )}
    </div>
  );
};
