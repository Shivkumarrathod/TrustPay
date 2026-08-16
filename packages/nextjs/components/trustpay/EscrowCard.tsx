"use client";

import React, { useState } from "react";
import { Address } from "@scaffold-ui/components";
import { formatEther, zeroAddress } from "viem";
import { useAccount } from "wagmi";
import { ArrowRightIcon, ClockIcon, ScaleIcon, UserIcon } from "@heroicons/react/24/outline";
import { Escrow, EscrowStatus, getEscrowStatusBadge } from "~~/components/trustpay/types";

type EscrowCardProps = {
  escrow: Escrow;
  onSelect: (escrowId: bigint) => void;
};

export const EscrowCard: React.FC<EscrowCardProps> = ({ escrow, onSelect }) => {
  const { address: connectedAddress } = useAccount();
  const [currentTimestamp] = useState(() => Math.floor(Date.now() / 1000));

  const isBuyer = connectedAddress && escrow.buyer.toLowerCase() === connectedAddress.toLowerCase();
  const isSeller = connectedAddress && escrow.seller.toLowerCase() === connectedAddress.toLowerCase();
  const isArbiter = connectedAddress && escrow.arbiter.toLowerCase() === connectedAddress.toLowerCase();

  const statusBadge = getEscrowStatusBadge(escrow.status);

  // Calculate Progress Percent
  const total = Number(escrow.totalAmount);
  const released = Number(escrow.releasedAmount);
  const refunded = Number(escrow.refundedAmount);
  const progressPercent = total > 0 ? Math.min(100, Math.round(((released + refunded) / total) * 100)) : 0;

  // Deadline countdown check
  const deadline = Number(escrow.deadline);
  const isExpired = deadline <= currentTimestamp;
  const daysLeft = Math.ceil((deadline - currentTimestamp) / 86400);

  const isNative = escrow.token === zeroAddress;

  return (
    <div className="trust-card rounded-2xl p-5 border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between group">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              #{escrow.id.toString()}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-medium ${statusBadge.classes}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
              {statusBadge.label}
            </span>
          </div>

          {/* User Role Badge */}
          {isBuyer && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Buyer
            </span>
          )}
          {isSeller && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Seller
            </span>
          )}
          {isArbiter && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
              Arbiter
            </span>
          )}
        </div>

        {/* Amount & Value */}
        <div className="mb-4">
          <div className="text-xs text-slate-400 font-medium">Escrow Value</div>
          <div className="text-2xl font-extrabold text-white flex items-baseline gap-1.5">
            <span>{Number(formatEther(escrow.totalAmount)).toFixed(4)}</span>
            <span className="text-xs font-semibold text-emerald-400 uppercase">{isNative ? "ETH" : "ERC20"}</span>
          </div>
        </div>

        {/* Milestone Progress Bar */}
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between text-[11px] text-slate-400 font-medium">
            <span>Progress ({escrow.milestoneCount.toString()} Milestones)</span>
            <span>{progressPercent}% Settled</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-500 ${
                escrow.status === EscrowStatus.Disputed
                  ? "bg-rose-500"
                  : escrow.status === EscrowStatus.Completed
                    ? "bg-emerald-500"
                    : "bg-gradient-to-r from-emerald-500 to-cyan-400"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>Released: {Number(formatEther(escrow.releasedAmount)).toFixed(3)}</span>
            <span>
              Remaining:{" "}
              {Number(formatEther(escrow.totalAmount - escrow.releasedAmount - escrow.refundedAmount)).toFixed(3)}
            </span>
          </div>
        </div>

        {/* Counterparties list */}
        <div className="space-y-2 py-3 border-t border-b border-white/5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>Buyer:</span>
            </span>
            <Address address={escrow.buyer} size="xs" />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Seller:</span>
            </span>
            <Address address={escrow.seller} size="xs" />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <ScaleIcon className="w-3.5 h-3.5 text-violet-400" />
              <span>Arbiter:</span>
            </span>
            <Address address={escrow.arbiter} size="xs" />
          </div>
        </div>
      </div>

      {/* Footer / Action */}
      <div className="mt-4 pt-2 flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs">
          <ClockIcon className={`w-4 h-4 ${isExpired ? "text-rose-400" : "text-slate-400"}`} />
          {isExpired ? (
            <span className="text-rose-400 font-medium">Deadline Passed</span>
          ) : (
            <span className="text-slate-400">{daysLeft} days remaining</span>
          )}
        </div>

        <button
          onClick={() => onSelect(escrow.id)}
          className="btn btn-sm bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 gap-1 rounded-xl text-xs font-semibold group-hover:border-emerald-500/60 transition-all"
        >
          <span>Manage</span>
          <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
