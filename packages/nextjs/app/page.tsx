"use client";

import React, { useEffect, useState } from "react";
import type { NextPage } from "next";
import {
  ClockIcon,
  PlusCircleIcon,
  QuestionMarkCircleIcon,
  ScaleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { ActivityStream } from "~~/components/trustpay/ActivityStream";
import { CreateEscrowModal } from "~~/components/trustpay/CreateEscrowModal";
import { DisputeCenter } from "~~/components/trustpay/DisputeCenter";
import { EscrowDetailModal } from "~~/components/trustpay/EscrowDetailModal";
import { EscrowList } from "~~/components/trustpay/EscrowList";
import { HowItWorksModal } from "~~/components/trustpay/HowItWorksModal";
import { TrustPayHero } from "~~/components/trustpay/TrustPayHero";
import { EscrowStatus } from "~~/components/trustpay/types";
import { useAllEscrows } from "~~/components/trustpay/useAllEscrows";

const Home: NextPage = () => {
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<"escrows" | "disputes" | "activity">("escrows");
  const [activeFilter, setActiveFilter] = useState("all");

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [selectedEscrowId, setSelectedEscrowId] = useState<bigint | null>(null);

  // Hook to fetch and listen to all contract escrows
  const { escrows, count, isLoading, refetchAll } = useAllEscrows();

  // Calculate high-level stats
  const totalVolume = escrows.reduce((acc, curr) => acc + curr.totalAmount, 0n);
  const activeDisputesCount = escrows.filter(e => e.status === EscrowStatus.Disputed).length;

  // Listen to hash changes (e.g. #create, #disputes, #activity)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === "#create") {
        setIsCreateOpen(true);
      } else if (hash === "#disputes") {
        setActiveTab("disputes");
      } else if (hash === "#activity") {
        setActiveTab("activity");
      } else if (hash === "#how-it-works") {
        setIsHowItWorksOpen(true);
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <div className="min-h-screen bg-[#06070a] text-slate-100 flex flex-col justify-between">
      <div>
        {/* Hero Section with Live Stats */}
        <TrustPayHero
          escrowCount={count}
          totalVolume={totalVolume}
          activeDisputesCount={activeDisputesCount}
          onCreateClick={() => setIsCreateOpen(true)}
          onHowItWorksClick={() => setIsHowItWorksOpen(true)}
          onMyContractsClick={() => {
            setActiveFilter("my");
            setActiveTab("escrows");
          }}
          onDisputesClick={() => {
            setActiveTab("disputes");
          }}
        />

        {/* Main Application Container */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Main Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("escrows")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === "escrows"
                    ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                    : "bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800"
                }`}
              >
                <Squares2X2Icon className="w-4 h-4" />
                <span>Escrows Directory ({count})</span>
              </button>

              <button
                onClick={() => setActiveTab("disputes")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === "disputes"
                    ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                    : "bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800"
                }`}
              >
                <ScaleIcon className="w-4 h-4" />
                <span>Dispute Center</span>
                {activeDisputesCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-950 text-rose-300 text-xs font-mono font-bold">
                    {activeDisputesCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("activity")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === "activity"
                    ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20"
                    : "bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800"
                }`}
              >
                <ClockIcon className="w-4 h-4" />
                <span>Live Event Stream</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCreateOpen(true)}
                className="btn btn-sm btn-primary bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold border-0 px-4 gap-1.5 rounded-xl shadow-md shadow-emerald-500/20"
              >
                <PlusCircleIcon className="w-4 h-4 text-slate-950" />
                <span>New Escrow</span>
              </button>
            </div>
          </div>

          {/* Tab Content Views */}
          {activeTab === "escrows" && (
            <EscrowList
              escrows={escrows}
              isLoading={isLoading}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              onSelectEscrow={id => setSelectedEscrowId(id)}
              onCreateClick={() => setIsCreateOpen(true)}
            />
          )}

          {activeTab === "disputes" && (
            <DisputeCenter escrows={escrows} onSelectEscrow={id => setSelectedEscrowId(id)} />
          )}

          {activeTab === "activity" && <ActivityStream onSelectEscrow={id => setSelectedEscrowId(id)} />}
        </main>
      </div>

      {/* Modals & Dialogs */}
      {/* 1. Create Escrow Wizard */}
      <CreateEscrowModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSuccess={() => refetchAll()} />

      {/* 2. Escrow Detail Console */}
      <EscrowDetailModal
        escrowId={selectedEscrowId}
        isOpen={selectedEscrowId !== null}
        onClose={() => setSelectedEscrowId(null)}
        onRefresh={() => refetchAll()}
      />

      {/* 3. How It Works Infographic */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
        onCreateClick={() => setIsCreateOpen(true)}
      />
    </div>
  );
};

export default Home;
