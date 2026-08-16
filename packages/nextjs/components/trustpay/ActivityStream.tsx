"use client";

import React from "react";
import { Address } from "@scaffold-ui/components";
import { formatEther } from "viem";
import {
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ScaleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";

type ActivityStreamProps = {
  onSelectEscrow?: (id: bigint) => void;
};

export const ActivityStream: React.FC<ActivityStreamProps> = ({ onSelectEscrow }) => {
  // 1. EscrowCreated Events
  const { data: createdEvents } = useScaffoldEventHistory({
    contractName: "YourContract",
    eventName: "EscrowCreated",
    watch: true,
    fromBlock: 0n,
    blockData: true,
  });

  // 2. EscrowFunded Events
  const { data: fundedEvents } = useScaffoldEventHistory({
    contractName: "YourContract",
    eventName: "EscrowFunded",
    watch: true,
    fromBlock: 0n,
    blockData: true,
  });

  // 3. MilestoneSubmitted Events
  const { data: submittedEvents } = useScaffoldEventHistory({
    contractName: "YourContract",
    eventName: "MilestoneSubmitted",
    watch: true,
    fromBlock: 0n,
    blockData: true,
  });

  // 4. MilestoneApproved Events
  const { data: approvedEvents } = useScaffoldEventHistory({
    contractName: "YourContract",
    eventName: "MilestoneApproved",
    watch: true,
    fromBlock: 0n,
    blockData: true,
  });

  // 5. MilestonePaid Events
  const { data: paidEvents } = useScaffoldEventHistory({
    contractName: "YourContract",
    eventName: "MilestonePaid",
    watch: true,
    fromBlock: 0n,
    blockData: true,
  });

  // 6. DisputeRaised Events
  const { data: disputeEvents } = useScaffoldEventHistory({
    contractName: "YourContract",
    eventName: "DisputeRaised",
    watch: true,
    fromBlock: 0n,
    blockData: true,
  });

  // Combine and sort events
  const allEvents = React.useMemo(() => {
    const list: Array<{
      type: string;
      escrowId: bigint;
      milestoneId?: bigint;
      actor?: string;
      amount?: bigint;
      blockNumber: bigint;
      txHash: string;
      timestamp?: number;
    }> = [];

    (createdEvents || []).forEach(e => {
      list.push({
        type: "EscrowCreated",
        escrowId: (e.args as any).escrowId as bigint,
        actor: (e.args as any).buyer as string,
        amount: (e.args as any).totalAmount as bigint,
        blockNumber: e.blockNumber ?? 0n,
        txHash: e.transactionHash || "",
        timestamp: Number((e as any).blockData?.timestamp || 0),
      });
    });

    (fundedEvents || []).forEach(e => {
      list.push({
        type: "EscrowFunded",
        escrowId: (e.args as any).escrowId as bigint,
        amount: (e.args as any).amount as bigint,
        blockNumber: e.blockNumber ?? 0n,
        txHash: e.transactionHash || "",
        timestamp: Number((e as any).blockData?.timestamp || 0),
      });
    });

    (submittedEvents || []).forEach(e => {
      list.push({
        type: "MilestoneSubmitted",
        escrowId: (e.args as any).escrowId as bigint,
        milestoneId: (e.args as any).milestoneId as bigint,
        blockNumber: e.blockNumber ?? 0n,
        txHash: e.transactionHash || "",
        timestamp: Number((e as any).blockData?.timestamp || 0),
      });
    });

    (approvedEvents || []).forEach(e => {
      list.push({
        type: "MilestoneApproved",
        escrowId: (e.args as any).escrowId as bigint,
        milestoneId: (e.args as any).milestoneId as bigint,
        blockNumber: e.blockNumber ?? 0n,
        txHash: e.transactionHash || "",
        timestamp: Number((e as any).blockData?.timestamp || 0),
      });
    });

    (paidEvents || []).forEach(e => {
      list.push({
        type: "MilestonePaid",
        escrowId: (e.args as any).escrowId as bigint,
        milestoneId: (e.args as any).milestoneId as bigint,
        actor: (e.args as any).seller as string,
        amount: (e.args as any).amount as bigint,
        blockNumber: e.blockNumber ?? 0n,
        txHash: e.transactionHash || "",
        timestamp: Number((e as any).blockData?.timestamp || 0),
      });
    });

    (disputeEvents || []).forEach(e => {
      list.push({
        type: "DisputeRaised",
        escrowId: (e.args as any).escrowId as bigint,
        milestoneId: (e.args as any).milestoneId as bigint,
        actor: (e.args as any).raisedBy as string,
        blockNumber: e.blockNumber ?? 0n,
        txHash: e.transactionHash || "",
        timestamp: Number((e as any).blockData?.timestamp || 0),
      });
    });

    // Sort descending by block number
    return list.sort((a, b) => Number(b.blockNumber - a.blockNumber));
  }, [createdEvents, fundedEvents, submittedEvents, approvedEvents, paidEvents, disputeEvents]);

  const renderEventBadge = (type: string) => {
    switch (type) {
      case "EscrowCreated":
        return {
          icon: <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />,
          label: "Escrow Created",
          color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        };
      case "EscrowFunded":
        return {
          icon: <CurrencyDollarIcon className="w-4 h-4 text-cyan-400" />,
          label: "Escrow Funded",
          color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
        };
      case "MilestoneSubmitted":
        return {
          icon: <SparklesIcon className="w-4 h-4 text-cyan-400" />,
          label: "Deliverable Submitted",
          color: "text-cyan-300 bg-cyan-500/10 border-cyan-500/20",
        };
      case "MilestoneApproved":
        return {
          icon: <CheckCircleIcon className="w-4 h-4 text-emerald-400" />,
          label: "Milestone Approved",
          color: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
        };
      case "MilestonePaid":
        return {
          icon: <CurrencyDollarIcon className="w-4 h-4 text-emerald-400" />,
          label: "Payment Released",
          color: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30 font-bold",
        };
      case "DisputeRaised":
        return {
          icon: <ScaleIcon className="w-4 h-4 text-rose-400" />,
          label: "Dispute Raised",
          color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
        };
      default:
        return {
          icon: <ClockIcon className="w-4 h-4 text-slate-400" />,
          label: type,
          color: "text-slate-400 bg-slate-800",
        };
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-5 rounded-2xl trust-glass border border-white/10 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-emerald-400" />
            <span>Real-Time On-Chain Event Feed</span>
          </h2>
          <p className="text-xs text-slate-400">Live stream of all TrustPay contract events and state transitions</p>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>WebSocket Sync Live</span>
        </div>
      </div>

      {allEvents.length > 0 ? (
        <div className="space-y-2.5">
          {allEvents.map((evt, idx) => {
            const badge = renderEventBadge(evt.type);

            return (
              <div
                key={`${evt.txHash}-${idx}`}
                className="p-4 rounded-xl trust-card border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl border ${badge.color}`}>{badge.icon}</div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{badge.label}</span>
                      <button
                        onClick={() => onSelectEscrow?.(evt.escrowId)}
                        className="font-mono text-emerald-400 hover:underline cursor-pointer"
                      >
                        Escrow #{evt.escrowId.toString()}
                      </button>
                      {evt.milestoneId !== undefined && (
                        <span className="text-slate-400">(Milestone #{Number(evt.milestoneId) + 1})</span>
                      )}
                    </div>

                    {evt.amount && (
                      <div className="text-emerald-400 font-mono font-medium mt-0.5">
                        Amount: {Number(formatEther(evt.amount)).toFixed(4)} MON
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px] self-end sm:self-auto">
                  {evt.actor && (
                    <div className="flex items-center gap-1">
                      <span>By:</span>
                      <Address address={evt.actor} size="xs" />
                    </div>
                  )}

                  {evt.timestamp && <span>{new Date(evt.timestamp * 1000).toLocaleTimeString()}</span>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="trust-card rounded-2xl p-10 text-center border border-white/10 space-y-2">
          <ClockIcon className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No Events Recorded Yet</h3>
          <p className="text-xs text-slate-500">
            Create an escrow or trigger milestone actions to view real-time events.
          </p>
        </div>
      )}
    </div>
  );
};
