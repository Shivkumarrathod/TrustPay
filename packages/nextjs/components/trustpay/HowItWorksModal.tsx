"use client";

import React from "react";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  LockClosedIcon,
  ScaleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

type HowItWorksModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreateClick?: () => void;
};

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose, onCreateClick }) => {
  if (!isOpen) return null;

  const steps = [
    {
      step: 1,
      title: "1. Create Escrow Agreement",
      icon: <ShieldCheckIcon className="w-6 h-6 text-emerald-400" />,
      color: "border-emerald-500/40 bg-emerald-950/20",
      description:
        "The Buyer defines the counterparty (Seller), assigns an independent Arbiter, sets an expiry deadline, and breaks down the project into milestone stages with specific payouts.",
    },
    {
      step: 2,
      title: "2. Lock Funds Safely",
      icon: <LockClosedIcon className="w-6 h-6 text-cyan-400" />,
      color: "border-cyan-500/40 bg-cyan-950/20",
      description:
        "Buyer deposits the total contract amount (MON or ERC20). Funds are held in a non-custodial smart contract governed by OpenZeppelin ReentrancyGuard.",
    },
    {
      step: 3,
      title: "3. Deliver & Submit Proof",
      icon: <SparklesIcon className="w-6 h-6 text-indigo-400" />,
      color: "border-indigo-500/40 bg-indigo-950/20",
      description:
        "Seller works on each milestone and submits verified proof hashes (e.g. IPFS deliverables, GitHub commits, design links) on-chain.",
    },
    {
      step: 4,
      title: "4. Review & Instant Payout",
      icon: <CheckCircleIcon className="w-6 h-6 text-emerald-400" />,
      color: "border-emerald-500/40 bg-emerald-950/20",
      description:
        "Buyer inspects deliverables and clicks Approve. Funds for that milestone are released instantly and securely to the Seller's wallet.",
    },
    {
      step: 5,
      title: "5. Impartial Dispute Arbitration",
      icon: <ScaleIcon className="w-6 h-6 text-rose-400" />,
      color: "border-rose-500/40 bg-rose-950/20",
      description:
        "If a disagreement occurs, either party can raise a dispute. The assigned Arbiter reviews the milestone evidence and executes an on-chain split between Buyer and Seller.",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#0e111a] border border-white/15 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-[#141928] to-[#0e111a]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheckIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">How TrustPay Escrow Works</h2>
              <p className="text-xs text-slate-400">Trustless milestone payment protocol architecture</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 gap-3.5">
            {steps.map(s => (
              <div key={s.step} className={`p-4 rounded-xl border ${s.color} flex items-start gap-4 transition-all`}>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-white/10 shrink-0 mt-0.5">{s.icon}</div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">{s.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{s.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Security Guarantee Box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/30 via-slate-900 to-cyan-950/30 border border-emerald-500/30 space-y-1 text-xs">
            <div className="font-bold text-emerald-300 flex items-center gap-1.5">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
              <span>Non-Custodial Guarantee & Deadline Expiry</span>
            </div>
            <p className="text-slate-300">
              If the Seller fails to deliver before the deadline, the Buyer can unilaterally claim a 100% refund of any
              unreleased milestones once the timer expires.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#121624]">
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm text-slate-400 hover:text-white">
            Close
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onCreateClick?.();
            }}
            className="btn btn-primary bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold border-0 px-5 gap-1.5"
          >
            <span>Create Your First Escrow</span>
            <ArrowRightIcon className="w-4 h-4 text-slate-950" />
          </button>
        </div>
      </div>
    </div>
  );
};
