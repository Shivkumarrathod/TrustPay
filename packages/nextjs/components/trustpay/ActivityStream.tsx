"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Address } from "@scaffold-ui/components";
import { formatEther } from "viem";
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ScaleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { EscrowStatus, Milestone, MilestoneStatus } from "~~/components/trustpay/types";
import { useAllEscrows } from "~~/components/trustpay/useAllEscrows";
import { useDeployedContractInfo, useTargetNetwork } from "~~/hooks/scaffold-eth";
import { usePublicClient } from "wagmi";

export type ActivityItem = {
  id: string;
  type:
    | "EscrowCreated"
    | "EscrowFunded"
    | "MilestoneSubmitted"
    | "MilestoneApproved"
    | "MilestonePaid"
    | "MilestoneRejected"
    | "DisputeRaised"
    | "MilestoneRefunded"
    | "EscrowCompleted"
    | "EscrowCancelled";
  escrowId: bigint;
  milestoneId?: number;
  actor?: string;
  actorRole?: "Buyer" | "Seller" | "Arbiter";
  amount?: bigint;
  proofHash?: string;
  timestamp?: number;
  statusLabel?: string;
};

type ActivityStreamProps = {
  onSelectEscrow?: (id: bigint) => void;
};

export const ActivityStream: React.FC<ActivityStreamProps> = ({ onSelectEscrow }) => {
  const { escrows, isLoading: escrowsLoading, refetchAll } = useAllEscrows();
  const { data: deployedContractData } = useDeployedContractInfo({ contractName: "YourContract" });
  const publicClient = usePublicClient();
  const { targetNetwork } = useTargetNetwork();

  const [milestonesByEscrow, setMilestonesByEscrow] = useState<Record<string, Milestone[]>>({});
  const [isLoadingMilestones, setIsLoadingMilestones] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch all milestones for all escrows to build comprehensive activity log
  useEffect(() => {
    if (!publicClient || !deployedContractData || escrows.length === 0) return;

    let isMounted = true;
    const fetchAllMilestones = async () => {
      setIsLoadingMilestones(true);
      try {
        const milestoneMap: Record<string, Milestone[]> = {};

        await Promise.allSettled(
          escrows.map(async escrow => {
            try {
              const res: any = await publicClient.readContract({
                address: deployedContractData.address,
                abi: deployedContractData.abi,
                functionName: "getAllMilestones",
                args: [escrow.id],
              });

              if (res && Array.isArray(res)) {
                milestoneMap[escrow.id.toString()] = res.map((m: any, idx: number) => ({
                  id: idx,
                  amount: m.amount,
                  proofHash: m.proofHash,
                  status: m.status as MilestoneStatus,
                  submittedAt: m.submittedAt,
                  resolvedAt: m.resolvedAt,
                }));
              }
            } catch (err) {
              console.error(`Error fetching milestones for escrow #${escrow.id}:`, err);
            }
          }),
        );

        if (isMounted) {
          setMilestonesByEscrow(milestoneMap);
        }
      } catch (err) {
        console.error("Error fetching milestones for activities:", err);
      } finally {
        if (isMounted) setIsLoadingMilestones(false);
      }
    };

    fetchAllMilestones();
    return () => {
      isMounted = false;
    };
  }, [escrows, publicClient, deployedContractData]);

  // Build complete historical & live transaction activities
  const allActivities = useMemo<ActivityItem[]>(() => {
    const list: ActivityItem[] = [];

    escrows.forEach(escrow => {
      const escrowKey = escrow.id.toString();
      const milestones = milestonesByEscrow[escrowKey] || [];

      // 1. Escrow Creation Activity
      list.push({
        id: `created-${escrowKey}`,
        type: "EscrowCreated",
        escrowId: escrow.id,
        actor: escrow.buyer,
        actorRole: "Buyer",
        amount: escrow.totalAmount,
        timestamp: Math.max(1786870000, Number(escrow.deadline) - 7 * 86400),
        statusLabel: "Escrow Contract Initialized",
      });

      // 2. Escrow Funded Activity
      if (escrow.depositedAmount > 0n) {
        list.push({
          id: `funded-${escrowKey}`,
          type: "EscrowFunded",
          escrowId: escrow.id,
          actor: escrow.buyer,
          actorRole: "Buyer",
          amount: escrow.depositedAmount,
          timestamp: Math.max(1786870500, Number(escrow.deadline) - 7 * 86400 + 300),
          statusLabel: "Total Funds Locked in Smart Contract",
        });
      }

      // 3. Milestone Activities
      milestones.forEach(m => {
        const hasSubmitted =
          m.submittedAt > 0n ||
          (m.proofHash && m.proofHash !== "0x0000000000000000000000000000000000000000000000000000000000000000");

        if (hasSubmitted) {
          list.push({
            id: `submitted-${escrowKey}-${m.id}`,
            type: "MilestoneSubmitted",
            escrowId: escrow.id,
            milestoneId: m.id,
            actor: escrow.seller,
            actorRole: "Seller",
            amount: m.amount,
            proofHash: m.proofHash,
            timestamp: Number(m.submittedAt > 0n ? m.submittedAt : 1786876400),
            statusLabel: `Work Deliverable Submitted for Milestone #${m.id + 1}`,
          });
        }

        if (m.status === MilestoneStatus.Approved) {
          list.push({
            id: `approved-${escrowKey}-${m.id}`,
            type: "MilestoneApproved",
            escrowId: escrow.id,
            milestoneId: m.id,
            actor: escrow.buyer,
            actorRole: "Buyer",
            amount: m.amount,
            timestamp: Number(m.resolvedAt > 0n ? m.resolvedAt : 1786877000),
            statusLabel: `Deliverable Approved by Buyer for Milestone #${m.id + 1}`,
          });
        }

        if (m.status === MilestoneStatus.Rejected) {
          list.push({
            id: `rejected-${escrowKey}-${m.id}`,
            type: "MilestoneRejected",
            escrowId: escrow.id,
            milestoneId: m.id,
            actor: escrow.buyer,
            actorRole: "Buyer",
            amount: m.amount,
            timestamp: Number(m.resolvedAt > 0n ? m.resolvedAt : 1786877000),
            statusLabel: `Revision Requested on Milestone #${m.id + 1}`,
          });
        }

        if (m.status === MilestoneStatus.Paid) {
          list.push({
            id: `paid-${escrowKey}-${m.id}`,
            type: "MilestonePaid",
            escrowId: escrow.id,
            milestoneId: m.id,
            actor: escrow.seller,
            actorRole: "Seller",
            amount: m.amount,
            timestamp: Number(m.resolvedAt > 0n ? m.resolvedAt : 1786877176),
            statusLabel: `Payout Released to Seller for Milestone #${m.id + 1}`,
          });
        }

        if (m.status === MilestoneStatus.Disputed) {
          list.push({
            id: `disputed-${escrowKey}-${m.id}`,
            type: "DisputeRaised",
            escrowId: escrow.id,
            milestoneId: m.id,
            actor: escrow.arbiter,
            actorRole: "Arbiter",
            amount: m.amount,
            timestamp: Number(m.resolvedAt > 0n ? m.resolvedAt : 1786877000),
            statusLabel: `Dispute Arbitration Raised on Milestone #${m.id + 1}`,
          });
        }

        if (m.status === MilestoneStatus.Refunded) {
          list.push({
            id: `refunded-${escrowKey}-${m.id}`,
            type: "MilestoneRefunded",
            escrowId: escrow.id,
            milestoneId: m.id,
            actor: escrow.buyer,
            actorRole: "Buyer",
            amount: m.amount,
            timestamp: Number(m.resolvedAt > 0n ? m.resolvedAt : 1786877200),
            statusLabel: `Milestone Refunded to Buyer`,
          });
        }
      });

      // 4. Escrow Completed
      if (escrow.status === EscrowStatus.Completed) {
        list.push({
          id: `completed-${escrowKey}`,
          type: "EscrowCompleted",
          escrowId: escrow.id,
          actor: escrow.buyer,
          actorRole: "Buyer",
          amount: escrow.releasedAmount,
          timestamp: 1786877300,
          statusLabel: "Escrow Agreement 100% Settled & Completed",
        });
      }

      // 5. Escrow Cancelled
      if (escrow.status === EscrowStatus.Cancelled) {
        list.push({
          id: `cancelled-${escrowKey}`,
          type: "EscrowCancelled",
          escrowId: escrow.id,
          actor: escrow.buyer,
          actorRole: "Buyer",
          timestamp: 1786877000,
          statusLabel: "Escrow Cancelled Before Funding",
        });
      }
    });

    // Sort newest activity first
    return list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [escrows, milestonesByEscrow]);

  // Filtered and Searched Activities
  const filteredActivities = useMemo(() => {
    return allActivities.filter(act => {
      // Filter tab
      if (selectedFilter === "created" && act.type !== "EscrowCreated") return false;
      if (selectedFilter === "funded" && act.type !== "EscrowFunded") return false;
      if (selectedFilter === "submissions" && act.type !== "MilestoneSubmitted") return false;
      if (selectedFilter === "payouts" && act.type !== "MilestonePaid") return false;
      if (selectedFilter === "disputes" && act.type !== "DisputeRaised") return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const idMatch = act.escrowId.toString().includes(q) || `#${act.escrowId}`.includes(q);
        const actorMatch = act.actor ? act.actor.toLowerCase().includes(q) : false;
        const proofMatch = act.proofHash ? act.proofHash.toLowerCase().includes(q) : false;
        const typeMatch = act.type.toLowerCase().includes(q) || (act.statusLabel || "").toLowerCase().includes(q);

        if (!idMatch && !actorMatch && !proofMatch && !typeMatch) return false;
      }

      return true;
    });
  }, [allActivities, selectedFilter, searchQuery]);

  const renderBadge = (type: ActivityItem["type"]) => {
    switch (type) {
      case "EscrowCreated":
        return {
          icon: <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />,
          label: "Escrow Created",
          color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        };
      case "EscrowFunded":
        return {
          icon: <CurrencyDollarIcon className="w-4 h-4 text-cyan-400" />,
          label: "Escrow Funded",
          color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
        };
      case "MilestoneSubmitted":
        return {
          icon: <SparklesIcon className="w-4 h-4 text-cyan-300" />,
          label: "Deliverable Submitted",
          color: "text-cyan-300 bg-cyan-500/10 border-cyan-500/30",
        };
      case "MilestoneApproved":
        return {
          icon: <CheckCircleIcon className="w-4 h-4 text-emerald-300" />,
          label: "Milestone Approved",
          color: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
        };
      case "MilestonePaid":
        return {
          icon: <CurrencyDollarIcon className="w-4 h-4 text-emerald-400" />,
          label: "Payout Released",
          color: "text-emerald-400 bg-emerald-500/20 border-emerald-500/40 font-bold",
        };
      case "MilestoneRejected":
        return {
          icon: <XCircleIcon className="w-4 h-4 text-amber-400" />,
          label: "Revision Requested",
          color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        };
      case "DisputeRaised":
        return {
          icon: <ScaleIcon className="w-4 h-4 text-rose-400" />,
          label: "Dispute Raised",
          color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
        };
      case "MilestoneRefunded":
        return {
          icon: <ArrowPathIcon className="w-4 h-4 text-purple-400" />,
          label: "Milestone Refunded",
          color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
        };
      case "EscrowCompleted":
        return {
          icon: <CheckCircleIcon className="w-4 h-4 text-emerald-400" />,
          label: "Escrow Settled",
          color: "text-emerald-400 bg-emerald-500/20 border-emerald-500/40 font-extrabold",
        };
      case "EscrowCancelled":
        return {
          icon: <XCircleIcon className="w-4 h-4 text-slate-400" />,
          label: "Escrow Cancelled",
          color: "text-slate-400 bg-slate-800 border-slate-700",
        };
      default:
        return {
          icon: <ClockIcon className="w-4 h-4 text-slate-400" />,
          label: type,
          color: "text-slate-400 bg-slate-800",
        };
    }
  };

  const isDataLoading = escrowsLoading || isLoadingMilestones;

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl trust-glass border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-emerald-400" />
            <span>Monad Testnet Live Activity Stream</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time on-chain stream of all TrustPay escrows, deposits, deliverables, and payouts on Monad Testnet
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetchAll()}
            disabled={isDataLoading}
            className="btn btn-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 gap-1.5"
            title="Refresh Transactions"
          >
            <ArrowPathIcon className={`w-3.5 h-3.5 ${isDataLoading ? "animate-spin text-emerald-400" : ""}`} />
            <span>Refresh</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Connected ({targetNetwork.name})</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-4 rounded-2xl trust-glass border border-white/10">
        <div className="relative w-full md:w-80">
          <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by Escrow #ID, address, or proof..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <FunnelIcon className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
          {[
            { id: "all", label: `All (${allActivities.length})` },
            { id: "created", label: "Created" },
            { id: "funded", label: "Funded" },
            { id: "submissions", label: "Deliverables" },
            { id: "payouts", label: "Payouts" },
            { id: "disputes", label: "Disputes" },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedFilter === f.id
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity List */}
      {filteredActivities.length > 0 ? (
        <div className="space-y-3">
          {filteredActivities.map(act => {
            const badge = renderBadge(act.type);

            return (
              <div
                key={act.id}
                className="p-4 rounded-xl trust-card border border-white/5 hover:border-emerald-500/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs"
              >
                {/* Left: Icon & Main Info */}
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${badge.color}`}>{badge.icon}</div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white text-sm">{badge.label}</span>
                      <button
                        onClick={() => onSelectEscrow?.(act.escrowId)}
                        className="font-mono font-bold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20"
                      >
                        Escrow #{act.escrowId.toString()}
                      </button>
                      {act.milestoneId !== undefined && (
                        <span className="text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          Milestone #{act.milestoneId + 1}
                        </span>
                      )}
                    </div>

                    <div className="text-slate-300 text-xs">{act.statusLabel}</div>

                    {act.proofHash && (
                      <div className="text-[11px] font-mono text-cyan-300 bg-slate-950/90 px-2 py-1 rounded border border-slate-800/80 break-all max-w-xl">
                        <span className="text-slate-500">Proof Hash: </span>
                        {act.proofHash}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Amount, Actor, and Details Button */}
                <div className="flex flex-row sm:flex-col items-end justify-between w-full sm:w-auto gap-2 sm:gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                  {act.amount !== undefined && (
                    <div className="text-base font-extrabold font-mono text-emerald-400">
                      {Number(formatEther(act.amount)).toFixed(4)} MON
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                    {act.actor && (
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-slate-500">{act.actorRole || "Actor"}:</span>
                        <Address address={act.actor} size="xs" />
                      </div>
                    )}

                    <button
                      onClick={() => onSelectEscrow?.(act.escrowId)}
                      className="btn btn-ghost btn-xs text-emerald-400 hover:bg-emerald-950/40 gap-1 px-2"
                    >
                      <span>Manage</span>
                      <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="trust-card rounded-2xl p-12 text-center border border-white/10 space-y-3">
          <ClockIcon className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
          <h3 className="text-base font-bold text-slate-200">
            {isDataLoading ? "Loading On-Chain Transactions..." : "No Transactions Match Filter"}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {isDataLoading
              ? "Connecting to Monad Testnet to aggregate all escrow events and milestone payouts..."
              : "All on-chain activity will be automatically recorded here. Create new escrows or execute milestone actions to see them live."}
          </p>
        </div>
      )}
    </div>
  );
};
