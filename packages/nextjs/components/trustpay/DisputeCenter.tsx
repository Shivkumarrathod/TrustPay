"use client";

import React from "react";
import { Address } from "@scaffold-ui/components";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { ArrowRightIcon, ScaleIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { Escrow, EscrowStatus } from "~~/components/trustpay/types";

type DisputeCenterProps = {
  escrows: Escrow[];
  onSelectEscrow: (id: bigint) => void;
};

export const DisputeCenter: React.FC<DisputeCenterProps> = ({ escrows, onSelectEscrow }) => {
  const { address: connectedAddress } = useAccount();

  const disputedEscrows = escrows.filter(e => e.status === EscrowStatus.Disputed);

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-6 rounded-2xl trust-card border border-rose-500/30 bg-gradient-to-r from-rose-950/20 via-[#10131f] to-[#0c0e17]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ScaleIcon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Dispute Arbitration Center</h2>
              <p className="text-xs text-slate-300">
                Impartial on-chain resolution hub for disputed milestone contracts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            <span>{disputedEscrows.length} Cases Requiring Arbitration</span>
          </div>
        </div>
      </div>

      {/* Disputed Escrows List */}
      {disputedEscrows.length > 0 ? (
        <div className="space-y-4">
          {disputedEscrows.map(escrow => {
            const isArbiter = connectedAddress && escrow.arbiter.toLowerCase() === connectedAddress.toLowerCase();

            return (
              <div
                key={escrow.id.toString()}
                className="p-5 rounded-2xl trust-card border border-rose-500/30 hover:border-rose-500/60 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                      Escrow #{escrow.id.toString()}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 font-medium">
                      Active Dispute
                    </span>
                    {isArbiter && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        You Are The Arbiter
                      </span>
                    )}
                  </div>

                  <div className="text-sm font-bold text-white">
                    Total In Escrow:{" "}
                    <span className="font-mono text-emerald-400">
                      {Number(formatEther(escrow.totalAmount)).toFixed(4)} ETH
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                    <div className="flex items-center gap-1">
                      <span>Buyer:</span>
                      <Address address={escrow.buyer} size="xs" />
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Seller:</span>
                      <Address address={escrow.seller} size="xs" />
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Arbiter:</span>
                      <Address address={escrow.arbiter} size="xs" />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSelectEscrow(escrow.id)}
                  className="btn btn-sm bg-rose-600 hover:bg-rose-500 text-white font-bold border-0 px-4 gap-1.5 rounded-xl text-xs shrink-0"
                >
                  <span>{isArbiter ? "Resolve Dispute" : "Inspect Dispute"}</span>
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="trust-card rounded-2xl p-12 text-center border border-white/10 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
            <ShieldCheckIcon className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">No Active Disputes</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            All escrow contracts and milestone deliverables are running smoothly with zero active disputes.
          </p>
        </div>
      )}
    </div>
  );
};
