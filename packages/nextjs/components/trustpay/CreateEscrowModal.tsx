"use client";

import React, { useState } from "react";
import { isAddress, parseEther, zeroAddress } from "viem";
import { useAccount } from "wagmi";
import {
  CalendarDaysIcon,
  PlusIcon,
  ScaleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrashIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

import { TRUSTPAY_DEFAULT_ARBITER } from "~~/components/trustpay/types";

type MilestoneDraft = {
  id: number;
  title: string;
  amount: string; // in MON
};

type CreateEscrowModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export const CreateEscrowModal: React.FC<CreateEscrowModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { address: connectedAddress } = useAccount();

  // Form State
  const [seller, setSeller] = useState("");
  const [arbiter, setArbiter] = useState(TRUSTPAY_DEFAULT_ARBITER);
  const [tokenType, setTokenType] = useState<"native" | "erc20">("native");
  const [customTokenAddress, setCustomTokenAddress] = useState("");
  const [deadlineDays, setDeadlineDays] = useState(7);
  const [customDeadlineDate, setCustomDeadlineDate] = useState("");

  const [milestones, setMilestones] = useState<MilestoneDraft[]>([
    { id: 1, title: "Milestone 1: Project Kickoff & Design", amount: "0.1" },
    { id: 2, title: "Milestone 2: Core Development & MVP", amount: "0.2" },
  ]);

  const { writeContractAsync, isPending } = useScaffoldWriteContract({
    contractName: "YourContract",
  });

  if (!isOpen) return null;

  // Add Milestone
  const addMilestone = () => {
    const nextId = milestones.length > 0 ? Math.max(...milestones.map(m => m.id)) + 1 : 1;
    setMilestones([...milestones, { id: nextId, title: `Milestone ${nextId}: Deliverable`, amount: "0.1" }]);
  };

  // Remove Milestone
  const removeMilestone = (id: number) => {
    if (milestones.length <= 1) {
      notification.error("At least one milestone is required");
      return;
    }
    setMilestones(milestones.filter(m => m.id !== id));
  };

  // Update Milestone
  const updateMilestone = (id: number, field: "title" | "amount", value: string) => {
    setMilestones(milestones.map(m => (m.id === id ? { ...m, [field]: value } : m)));
  };

  // Calculate Total Amount
  const totalMonAmount = milestones.reduce((sum, m) => {
    const val = parseFloat(m.amount) || 0;
    return sum + val;
  }, 0);

  // Quick helper to fill demo arbiter / seller
  const fillDemoAddresses = () => {
    setSeller("0x25e03a9f896267c823C70aC88bBFB1A49FB46036");
    setArbiter(TRUSTPAY_DEFAULT_ARBITER);
    notification.success("Filled demo seller address & official arbiter");
  };

  const handleCreate = async () => {
    if (!connectedAddress) {
      notification.error("Please connect your wallet first");
      return;
    }

    if (!isAddress(seller)) {
      notification.error("Invalid Seller wallet address");
      return;
    }

    if (seller.toLowerCase() === connectedAddress.toLowerCase()) {
      notification.error("Seller address cannot be the same as your Buyer address");
      return;
    }

    if (!isAddress(arbiter)) {
      notification.error("Invalid Arbiter wallet address");
      return;
    }

    if (tokenType === "erc20" && !isAddress(customTokenAddress)) {
      notification.error("Invalid ERC20 Token contract address");
      return;
    }

    if (milestones.length === 0) {
      notification.error("Please add at least one milestone");
      return;
    }

    for (let i = 0; i < milestones.length; i++) {
      const amt = parseFloat(milestones[i].amount);
      if (isNaN(amt) || amt <= 0) {
        notification.error(`Milestone #${i + 1} must have an amount greater than 0`);
        return;
      }
    }

    // Calculate deadline timestamp
    let deadlineTimestamp: bigint;
    if (deadlineDays === 0 && customDeadlineDate) {
      const ts = Math.floor(new Date(customDeadlineDate).getTime() / 1000);
      if (isNaN(ts) || ts <= Math.floor(Date.now() / 1000)) {
        notification.error("Custom deadline must be in the future");
        return;
      }
      deadlineTimestamp = BigInt(ts);
    } else {
      const now = Math.floor(Date.now() / 1000);
      deadlineTimestamp = BigInt(now + (deadlineDays || 7) * 86400);
    }

    const tokenAddress = tokenType === "native" ? zeroAddress : (customTokenAddress as `0x${string}`);
    const milestoneBigInts = milestones.map(m => parseEther(m.amount));
    const totalBigInt = milestoneBigInts.reduce((acc, curr) => acc + curr, 0n);

    try {
      notification.loading("Creating TrustPay Escrow Agreement...");

      await writeContractAsync({
        functionName: "createEscrow",
        args: [
          seller as `0x${string}`,
          tokenAddress,
          totalBigInt,
          deadlineTimestamp,
          arbiter as `0x${string}`,
          milestoneBigInts,
        ],
      });

      notification.remove("");
      notification.success("Escrow agreement successfully created!");
      onSuccess?.();
      onClose();
    } catch (err: any) {
      notification.remove("");
      console.error("Error creating escrow:", err);
      notification.error(err?.message || "Failed to create escrow");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0e111a] border border-white/15 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-[#141927] to-[#0e111a]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheckIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Create Escrow Agreement</h2>
              <p className="text-xs text-slate-400">Deploy a trustless milestone payment contract</p>
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
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Quick Demo Fill */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
            <span className="text-slate-300">Need quick testing addresses?</span>
            <button
              onClick={fillDemoAddresses}
              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
            >
              <SparklesIcon className="w-3.5 h-3.5" />
              <span>Fill Hardhat Test Accounts</span>
            </button>
          </div>

          {/* Section 1: Counterparties */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <UserIcon className="w-4 h-4 text-emerald-400" />
              <span>1. Agreement Counterparties</span>
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Seller / Service Provider Address <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                value={seller}
                onChange={e => setSeller(e.target.value)}
                placeholder="0x... (Recipient of milestone funds)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-300">
                  Arbiter Address <span className="text-cyan-400">*</span>
                </label>
                <span className="text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full font-medium">
                  Official TrustPay Arbiter
                </span>
              </div>
              <input
                type="text"
                value={arbiter}
                onChange={e => setArbiter(e.target.value)}
                placeholder="0x... (Official Arbiter)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Default constant arbiter <code className="text-cyan-400 font-mono">0xcfE8...f75d</code> ensures neutral dispute settlement.
              </p>
            </div>
          </div>

          {/* Section 2: Token Selection */}
          <div className="space-y-3 pt-2 border-t border-white/5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ScaleIcon className="w-4 h-4 text-cyan-400" />
              <span>2. Payment Currency</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTokenType("native")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  tokenType === "native"
                    ? "bg-emerald-950/30 border-emerald-500 text-white font-semibold"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="text-sm font-bold text-emerald-400">Native MON</div>
                <div className="text-xs text-slate-400">Direct Monad blockchain transfer</div>
              </button>

              <button
                type="button"
                onClick={() => setTokenType("erc20")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  tokenType === "erc20"
                    ? "bg-cyan-950/30 border-cyan-500 text-white font-semibold"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="text-sm font-bold text-cyan-400">Custom ERC20 Token</div>
                <div className="text-xs text-slate-400">USDC, USDT, or custom tokens</div>
              </button>
            </div>

            {tokenType === "erc20" && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">ERC20 Token Address</label>
                <input
                  type="text"
                  value={customTokenAddress}
                  onChange={e => setCustomTokenAddress(e.target.value)}
                  placeholder="0x... (ERC20 Contract Address)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-slate-100 text-sm font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Section 3: Milestones Builder */}
          <div className="space-y-3 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
                <span>3. Milestone Schedule</span>
              </h3>

              <button
                type="button"
                onClick={addMilestone}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/30 transition-colors"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                <span>Add Milestone</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {milestones.map((m, idx) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-3"
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold shrink-0">
                    {idx + 1}
                  </div>

                  <div className="grow w-full sm:w-auto">
                    <input
                      type="text"
                      value={m.title}
                      onChange={e => updateMilestone(m.id, "title", e.target.value)}
                      placeholder="Milestone description / phase"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-44 shrink-0">
                    <input
                      type="number"
                      step="0.01"
                      min="0.0001"
                      value={m.amount}
                      onChange={e => updateMilestone(m.id, "amount", e.target.value)}
                      placeholder="Amount"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono text-right"
                    />
                    <span className="text-xs text-slate-400 font-semibold shrink-0">MON</span>

                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMilestone(m.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Total summary bar */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300">
              <span className="text-xs font-medium">Total Escrow Value ({milestones.length} Milestones):</span>
              <span className="text-base font-extrabold font-mono text-emerald-400">
                {totalMonAmount.toFixed(4)} MON
              </span>
            </div>
          </div>

          {/* Section 4: Deadline Duration */}
          <div className="space-y-3 pt-2 border-t border-white/5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CalendarDaysIcon className="w-4 h-4 text-violet-400" />
              <span>4. Escrow Expiry Deadline</span>
            </h3>

            <div className="grid grid-cols-4 gap-2">
              {[
                { days: 3, label: "3 Days" },
                { days: 7, label: "7 Days" },
                { days: 14, label: "14 Days" },
                { days: 30, label: "30 Days" },
              ].map(opt => (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => {
                    setDeadlineDays(opt.days);
                    setCustomDeadlineDate("");
                  }}
                  className={`py-2 text-xs rounded-xl font-medium border transition-all ${
                    deadlineDays === opt.days && !customDeadlineDate
                      ? "bg-violet-950/50 border-violet-500 text-violet-300 font-bold"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#121624]">
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm text-slate-400 hover:text-white">
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCreate}
            disabled={isPending}
            className="btn btn-primary bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold border-0 px-6 gap-2"
          >
            {isPending ? (
              <>
                <span className="loading loading-spinner loading-xs text-slate-950" />
                <span>Confirming On-Chain...</span>
              </>
            ) : (
              <>
                <ShieldCheckIcon className="w-4 h-4 text-slate-950" />
                <span>Deploy Escrow ({totalMonAmount.toFixed(3)} MON)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
