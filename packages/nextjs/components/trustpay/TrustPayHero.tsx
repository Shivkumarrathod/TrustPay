"use client";

import React from "react";
import { formatEther } from "viem";
import {
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  DocumentCheckIcon,
  PlusCircleIcon,
  QuestionMarkCircleIcon,
  ScaleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

type TrustPayHeroProps = {
  escrowCount: number;
  totalVolume: bigint;
  activeDisputesCount: number;
  onCreateClick: () => void;
  onHowItWorksClick: () => void;
  onMyContractsClick?: () => void;
  onDisputesClick?: () => void;
};

export const TrustPayHero: React.FC<TrustPayHeroProps> = ({
  escrowCount,
  totalVolume,
  activeDisputesCount,
  onCreateClick,
  onHowItWorksClick,
  onMyContractsClick,
  onDisputesClick,
}) => {
  return (
    <section className="relative overflow-hidden pt-8 pb-10 px-4 sm:px-6 lg:px-8 border-b border-white/5 bg-gradient-to-b from-[#0e121d] via-[#090b12] to-[#06070a]">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Main Hero Pitch */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Trustless Multi-Party Escrow Protocol</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Decentralized Milestone Escrow{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                with Arbiter Protection
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Lock funds safely on-chain, deliver work in verifiable milestone stages, and release payouts trustlessly.
              Backed by independent dispute arbitration and zero custody risk.
            </p>

            {/* Hero Quick CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onCreateClick}
                className="btn btn-primary bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold border-0 shadow-lg shadow-emerald-500/25 px-6 gap-2"
              >
                <PlusCircleIcon className="w-5 h-5 text-slate-950" />
                <span>Create New Escrow</span>
              </button>

              {onMyContractsClick && (
                <button
                  onClick={onMyContractsClick}
                  className="btn bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-medium px-5 gap-2"
                >
                  <DocumentCheckIcon className="w-5 h-5 text-cyan-400" />
                  <span>My Contracts</span>
                </button>
              )}

              {activeDisputesCount > 0 && onDisputesClick && (
                <button
                  onClick={onDisputesClick}
                  className="btn bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 font-medium px-4 gap-1.5"
                >
                  <ScaleIcon className="w-4 h-4 text-rose-400" />
                  <span>{activeDisputesCount} Active Disputes</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics Dashboard */}
          <div className="lg:col-span-5">
            <div className="grid grid-cols-2 gap-3.5">
              {/* Stat 1: Total Escrows */}
              <div className="trust-card p-4 rounded-2xl border border-white/10 relative overflow-hidden group">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs font-medium uppercase tracking-wider">Total Escrows</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <ShieldCheckIcon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white">{escrowCount}</div>
                <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                  <ArrowTrendingUpIcon className="w-3.5 h-3.5" />
                  <span>Verified On-Chain</span>
                </div>
              </div>

              {/* Stat 2: Total Volume Locked */}
              <div className="trust-card p-4 rounded-2xl border border-white/10 relative overflow-hidden group">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs font-medium uppercase tracking-wider">Volume Transacted</span>
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                    <CurrencyDollarIcon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-cyan-300">
                  {Number(formatEther(totalVolume)).toFixed(3)}{" "}
                  <span className="text-xs font-semibold text-slate-400">MON</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Across all milestone releases</div>
              </div>

              {/* Stat 3: Arbiter Cases */}
              <div className="trust-card p-4 rounded-2xl border border-white/10 relative overflow-hidden group">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs font-medium uppercase tracking-wider">Active Disputes</span>
                  <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
                    <ScaleIcon className="w-4 h-4" />
                  </div>
                </div>
                <div
                  className={`text-2xl sm:text-3xl font-extrabold ${activeDisputesCount > 0 ? "text-rose-400" : "text-white"}`}
                >
                  {activeDisputesCount}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {activeDisputesCount === 0 ? "All settlements healthy" : "Requires Arbiter attention"}
                </div>
              </div>

              {/* Stat 4: Security Level */}
              <div className="trust-card p-4 rounded-2xl border border-white/10 relative overflow-hidden group">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs font-medium uppercase tracking-wider">Security Engine</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <DocumentCheckIcon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl font-bold text-emerald-300 mt-1">Non-Custodial</div>
                <div className="text-[11px] text-slate-400 mt-1">ReentrancyGuard & SafeERC20</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
