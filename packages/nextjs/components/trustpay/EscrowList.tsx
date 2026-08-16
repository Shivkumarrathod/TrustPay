"use client";

import React, { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { MagnifyingGlassIcon, PlusCircleIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { EscrowCard } from "~~/components/trustpay/EscrowCard";
import { Escrow, EscrowStatus } from "~~/components/trustpay/types";

type EscrowListProps = {
  escrows: Escrow[];
  isLoading: boolean;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  onSelectEscrow: (id: bigint) => void;
  onCreateClick: () => void;
};

export const EscrowList: React.FC<EscrowListProps> = ({
  escrows,
  isLoading,
  activeFilter,
  setActiveFilter,
  onSelectEscrow,
  onCreateClick,
}) => {
  const { address: connectedAddress } = useAccount();
  const [searchQuery, setSearchQuery] = useState("");

  // Filtered & Searched Escrows
  const filteredEscrows = useMemo(() => {
    return escrows.filter(escrow => {
      // 1. Role Filter
      if (activeFilter === "my") {
        if (!connectedAddress) return false;
        const c = connectedAddress.toLowerCase();
        const isParticipant =
          escrow.buyer.toLowerCase() === c || escrow.seller.toLowerCase() === c || escrow.arbiter.toLowerCase() === c;
        if (!isParticipant) return false;
      } else if (activeFilter === "buyer") {
        if (!connectedAddress || escrow.buyer.toLowerCase() !== connectedAddress.toLowerCase()) return false;
      } else if (activeFilter === "seller") {
        if (!connectedAddress || escrow.seller.toLowerCase() !== connectedAddress.toLowerCase()) return false;
      } else if (activeFilter === "arbiter") {
        if (!connectedAddress || escrow.arbiter.toLowerCase() !== connectedAddress.toLowerCase()) return false;
      } else if (activeFilter === "disputed") {
        if (escrow.status !== EscrowStatus.Disputed) return false;
      } else if (activeFilter === "active") {
        if (
          escrow.status !== EscrowStatus.Created &&
          escrow.status !== EscrowStatus.Funded &&
          escrow.status !== EscrowStatus.InProgress
        ) {
          return false;
        }
      } else if (activeFilter === "completed") {
        if (escrow.status !== EscrowStatus.Completed) return false;
      }

      // 2. Search Query (ID or Address)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const idMatch = escrow.id.toString().includes(query) || `#${escrow.id}`.includes(query);
        const buyerMatch = escrow.buyer.toLowerCase().includes(query);
        const sellerMatch = escrow.seller.toLowerCase().includes(query);
        const arbiterMatch = escrow.arbiter.toLowerCase().includes(query);

        if (!idMatch && !buyerMatch && !sellerMatch && !arbiterMatch) {
          return false;
        }
      }

      return true;
    });
  }, [escrows, activeFilter, searchQuery, connectedAddress]);

  return (
    <div className="space-y-6">
      {/* Search and Tab Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl trust-glass border border-white/10">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by ID (#1) or wallet address..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: "all", label: "All" },
            { id: "my", label: "My Escrows" },
            { id: "active", label: "Active" },
            { id: "disputed", label: "Disputed" },
            { id: "completed", label: "Completed" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeFilter === tab.id
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Escrow Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(n => (
            <div key={n} className="trust-card rounded-2xl p-5 border border-white/5 space-y-4 animate-pulse">
              <div className="h-5 bg-slate-800 rounded w-1/3" />
              <div className="h-8 bg-slate-800 rounded w-1/2" />
              <div className="h-3 bg-slate-800 rounded w-full" />
              <div className="h-16 bg-slate-900 rounded w-full" />
            </div>
          ))}
        </div>
      ) : filteredEscrows.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEscrows.map(escrow => (
            <EscrowCard key={escrow.id.toString()} escrow={escrow} onSelect={onSelectEscrow} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="trust-card rounded-2xl p-12 text-center border border-white/10 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
            <ShieldCheckIcon className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No Escrows Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery || activeFilter !== "all"
                ? "No escrows match your current search and filter settings."
                : "No escrows have been created on this network yet. Create your first milestone agreement."}
            </p>
          </div>

          <button
            onClick={onCreateClick}
            className="btn btn-primary bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold border-0 px-6 gap-2"
          >
            <PlusCircleIcon className="w-5 h-5 text-slate-950" />
            <span>Create New Escrow</span>
          </button>
        </div>
      )}
    </div>
  );
};
