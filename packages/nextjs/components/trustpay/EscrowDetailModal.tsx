"use client";

import React, { useState } from "react";
import { Address } from "@scaffold-ui/components";
import { formatEther, keccak256, stringToHex, toHex, zeroAddress } from "viem";
import { useAccount } from "wagmi";
import {
  ArrowPathIcon,
  ArrowUpRightIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ScaleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  Escrow,
  EscrowStatus,
  Milestone,
  MilestoneStatus,
  getEscrowStatusBadge,
  getMilestoneStatusBadge,
} from "~~/components/trustpay/types";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

type EscrowDetailModalProps = {
  escrowId: bigint | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
};

export const EscrowDetailModal: React.FC<EscrowDetailModalProps> = ({ escrowId, isOpen, onClose, onRefresh }) => {
  const { address: connectedAddress } = useAccount();
  const [currentTimestamp] = useState(() => Math.floor(Date.now() / 1000));

  // Submission / Proof input states
  const [activeMilestoneId, setActiveMilestoneId] = useState<number | null>(null);
  const [proofInput, setProofInput] = useState("");
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);

  // Dispute Split state for Arbiter
  const [disputeMilestoneId, setDisputeMilestoneId] = useState<number | null>(null);
  const [sellerSplitPercent, setSellerSplitPercent] = useState<number>(50);

  // Read live contract state for this escrow
  const { data: rawEscrow, refetch: refetchEscrow } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "getEscrow",
    args: [escrowId ?? 0n],
  });

  // Read milestones
  const { data: rawMilestones, refetch: refetchMilestones } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "getAllMilestones",
    args: [escrowId ?? 0n],
  });

  // Contract write hook
  const { writeContractAsync, isPending } = useScaffoldWriteContract({
    contractName: "YourContract",
  });

  if (!isOpen || escrowId === null || !rawEscrow) return null;

  const escrow: Escrow = {
    id: rawEscrow.id,
    buyer: rawEscrow.buyer,
    seller: rawEscrow.seller,
    token: rawEscrow.token,
    totalAmount: rawEscrow.totalAmount,
    depositedAmount: rawEscrow.depositedAmount,
    releasedAmount: rawEscrow.releasedAmount,
    refundedAmount: rawEscrow.refundedAmount,
    deadline: rawEscrow.deadline,
    arbiter: rawEscrow.arbiter,
    status: rawEscrow.status as EscrowStatus,
    milestoneCount: rawEscrow.milestoneCount,
  };

  const milestones: Milestone[] = (rawMilestones || []).map((m: any, idx: number) => ({
    id: idx,
    amount: m.amount,
    proofHash: m.proofHash,
    status: m.status as MilestoneStatus,
    submittedAt: m.submittedAt,
    resolvedAt: m.resolvedAt,
  }));

  const isBuyer = connectedAddress && escrow.buyer.toLowerCase() === connectedAddress.toLowerCase();
  const isSeller = connectedAddress && escrow.seller.toLowerCase() === connectedAddress.toLowerCase();
  const isArbiter = connectedAddress && escrow.arbiter.toLowerCase() === connectedAddress.toLowerCase();

  const isNative = escrow.token === zeroAddress;
  const statusBadge = getEscrowStatusBadge(escrow.status);

  // Deadline calculation
  const deadline = Number(escrow.deadline);
  const isExpired = deadline <= currentTimestamp;
  const daysLeft = Math.ceil((deadline - currentTimestamp) / 86400);

  // Helper to reload contract data
  const handleRefetch = () => {
    refetchEscrow();
    refetchMilestones();
    onRefresh?.();
  };

  // -------------------------------------------------------------
  // ESCROW ACTIONS
  // -------------------------------------------------------------

  // 1. Fund Escrow (Buyer)
  const handleFundEscrow = async () => {
    try {
      notification.loading("Depositing funds to escrow...");
      if (isNative) {
        await writeContractAsync({
          functionName: "fundNativeEscrow",
          args: [escrow.id],
          value: escrow.totalAmount,
        });
      } else {
        await writeContractAsync({
          functionName: "fundTokenEscrow",
          args: [escrow.id],
        });
      }
      notification.remove("");
      notification.success("Escrow successfully funded!");
      handleRefetch();
    } catch (err: any) {
      notification.remove("");
      console.error("Fund error:", err);
      notification.error(err?.message || "Failed to fund escrow");
    }
  };

  // 2. Cancel Escrow (Buyer before funding)
  const handleCancelEscrow = async () => {
    try {
      notification.loading("Cancelling escrow...");
      await writeContractAsync({
        functionName: "cancelEscrow",
        args: [escrow.id],
      });
      notification.remove("");
      notification.success("Escrow cancelled");
      handleRefetch();
    } catch (err: any) {
      notification.remove("");
      console.error("Cancel error:", err);
      notification.error(err?.message || "Failed to cancel escrow");
    }
  };

  // 3. Claim Deadline Refund (Buyer after deadline)
  const handleRefundMilestone = async (milestoneId: number) => {
    try {
      notification.loading("Claiming refund for milestone after deadline...");
      await writeContractAsync({
        functionName: "refundMilestoneAfterDeadline",
        args: [escrow.id, BigInt(milestoneId)],
      });
      notification.remove("");
      notification.success("Milestone funds refunded to your wallet!");
      handleRefetch();
    } catch (err: any) {
      notification.remove("");
      console.error("Refund error:", err);
      notification.error(err?.message || "Failed to claim refund");
    }
  };

  // -------------------------------------------------------------
  // MILESTONE ACTIONS
  // -------------------------------------------------------------

  // 4. Submit Milestone Deliverable (Seller)
  const handleSubmitMilestone = async (milestoneId: number, isResubmit = false) => {
    if (!proofInput.trim()) {
      notification.error("Please enter deliverable URL, IPFS hash, or description");
      return;
    }

    let proofBytes32: `0x${string}`;
    try {
      if (proofInput.startsWith("0x") && proofInput.length === 66) {
        proofBytes32 = proofInput as `0x${string}`;
      } else {
        // Hash the deliverable text / URL into a 32-byte hash
        proofBytes32 = keccak256(toHex(proofInput));
      }
    } catch {
      proofBytes32 = keccak256(stringToHex(proofInput));
    }

    try {
      setIsSubmittingProof(true);
      notification.loading(isResubmit ? "Resubmitting milestone..." : "Submitting milestone deliverable...");

      await writeContractAsync({
        functionName: isResubmit ? "resubmitMilestone" : "submitMilestone",
        args: [escrow.id, BigInt(milestoneId), proofBytes32],
      });

      notification.remove("");
      notification.success("Milestone submitted successfully!");
      setActiveMilestoneId(null);
      setProofInput("");
      handleRefetch();
    } catch (err: any) {
      notification.remove("");
      console.error("Submit error:", err);
      notification.error(err?.message || "Failed to submit milestone");
    } finally {
      setIsSubmittingProof(false);
    }
  };

  // 5. Approve Milestone (Buyer)
  const handleApproveMilestone = async (milestoneId: number) => {
    try {
      notification.loading("Approving milestone deliverable...");
      await writeContractAsync({
        functionName: "approveMilestone",
        args: [escrow.id, BigInt(milestoneId)],
      });
      notification.remove("");
      notification.success("Milestone approved!");
      handleRefetch();
    } catch (err: any) {
      notification.remove("");
      console.error("Approve error:", err);
      notification.error(err?.message || "Failed to approve milestone");
    }
  };

  // 6. Reject Milestone (Buyer)
  const handleRejectMilestone = async (milestoneId: number) => {
    try {
      notification.loading("Requesting revision for milestone...");
      await writeContractAsync({
        functionName: "rejectMilestone",
        args: [escrow.id, BigInt(milestoneId)],
      });
      notification.remove("");
      notification.success("Revision requested from seller");
      handleRefetch();
    } catch (err: any) {
      notification.remove("");
      console.error("Reject error:", err);
      notification.error(err?.message || "Failed to reject milestone");
    }
  };

  // 7. Release Milestone Funds (Buyer / Anyone once approved)
  const handleReleaseMilestone = async (milestoneId: number) => {
    try {
      notification.loading("Releasing funds to seller...");
      await writeContractAsync({
        functionName: "releaseMilestone",
        args: [escrow.id, BigInt(milestoneId)],
      });
      notification.remove("");
      notification.success("Milestone payment successfully released to seller!");
      handleRefetch();
    } catch (err: any) {
      notification.remove("");
      console.error("Release error:", err);
      notification.error(err?.message || "Failed to release milestone");
    }
  };

  // 8. Raise Dispute (Buyer or Seller)
  const handleRaiseDispute = async (milestoneId: number) => {
    if (
      !confirm(
        "Are you sure you want to raise a dispute? This will freeze milestone funds and notify the Arbiter for review.",
      )
    ) {
      return;
    }

    try {
      notification.loading("Raising dispute to Arbiter...");
      await writeContractAsync({
        functionName: "raiseDispute",
        args: [escrow.id, BigInt(milestoneId)],
      });
      notification.remove("");
      notification.warning("Dispute raised. Milestone is now in arbitration.");
      handleRefetch();
    } catch (err: any) {
      notification.remove("");
      console.error("Dispute error:", err);
      notification.error(err?.message || "Failed to raise dispute");
    }
  };

  // 9. Resolve Dispute (Arbiter only)
  const handleResolveDispute = async (milestone: Milestone) => {
    const totalMilestoneWei = milestone.amount;
    const sellerSplitWei = (totalMilestoneWei * BigInt(sellerSplitPercent)) / 100n;
    const buyerSplitWei = totalMilestoneWei - sellerSplitWei;

    try {
      notification.loading("Executing Arbiter resolution...");
      await writeContractAsync({
        functionName: "resolveDispute",
        args: [escrow.id, BigInt(milestone.id), sellerSplitWei, buyerSplitWei],
      });
      notification.remove("");
      notification.success("Dispute resolved! Funds distributed per Arbiter decision.");
      setDisputeMilestoneId(null);
      handleRefetch();
    } catch (err: any) {
      notification.remove("");
      console.error("Resolve error:", err);
      notification.error(err?.message || "Failed to resolve dispute");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0e111a] border border-white/15 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-[#141928] via-[#0f1320] to-[#0e111a]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheckIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-white">Escrow #{escrow.id.toString()}</h2>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusBadge.classes}`}>
                  <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${statusBadge.dot}`} />
                  {statusBadge.label}
                </span>
              </div>
              <p className="text-xs text-slate-400">Decentralized TrustPay Milestone Console</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefetch}
              title="Refresh contract state"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* User Role Banner */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
              isBuyer
                ? "bg-cyan-950/40 border-cyan-500/40 text-cyan-300"
                : isSeller
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                  : isArbiter
                    ? "bg-violet-950/40 border-violet-500/40 text-violet-300"
                    : "bg-slate-900 border-slate-800 text-slate-400"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              <span className="font-semibold">
                {isBuyer
                  ? "You are connected as the BUYER for this escrow."
                  : isSeller
                    ? "You are connected as the SELLER / Service Provider."
                    : isArbiter
                      ? "You are the designated ARBITER for this escrow."
                      : "You are viewing this contract as an Observer."}
              </span>
            </div>

            <div className="text-[11px] opacity-80">
              {isBuyer && escrow.status === EscrowStatus.Created && "Action needed: Deposit funds to activate."}
              {isSeller && escrow.status === EscrowStatus.Funded && "Action needed: Submit milestone deliverables."}
              {isArbiter && escrow.status === EscrowStatus.Disputed && "Action needed: Review dispute & resolve."}
            </div>
          </div>

          {/* Financial Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Total Value</div>
              <div className="text-lg font-extrabold text-white mt-1">
                {Number(formatEther(escrow.totalAmount)).toFixed(4)}{" "}
                <span className="text-xs text-emerald-400 uppercase">{isNative ? "MON" : "ERC20"}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Deposited</div>
              <div className="text-lg font-extrabold text-cyan-300 mt-1">
                {Number(formatEther(escrow.depositedAmount)).toFixed(4)}{" "}
                <span className="text-xs text-slate-400">MON</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Released to Seller</div>
              <div className="text-lg font-extrabold text-emerald-400 mt-1">
                {Number(formatEther(escrow.releasedAmount)).toFixed(4)}{" "}
                <span className="text-xs text-slate-400">MON</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Refunded to Buyer</div>
              <div className="text-lg font-extrabold text-purple-400 mt-1">
                {Number(formatEther(escrow.refundedAmount)).toFixed(4)}{" "}
                <span className="text-xs text-slate-400">MON</span>
              </div>
            </div>
          </div>

          {/* Escrow Quick Action Bar (e.g. Funding or Cancellation) */}
          {escrow.status === EscrowStatus.Created && isBuyer && (
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-amber-300 text-xs">
                <ExclamationTriangleIcon className="w-5 h-5 text-amber-400 shrink-0" />
                <span>
                  This escrow is created and awaiting your initial deposit of{" "}
                  <strong>{Number(formatEther(escrow.totalAmount)).toFixed(4)} MON</strong>.
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleCancelEscrow}
                  disabled={isPending}
                  className="btn btn-sm bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs"
                >
                  Cancel Escrow
                </button>

                <button
                  onClick={handleFundEscrow}
                  disabled={isPending}
                  className="btn btn-sm btn-primary bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold border-0 px-4 text-xs"
                >
                  {isPending
                    ? "Depositing..."
                    : `Deposit & Fund (${Number(formatEther(escrow.totalAmount)).toFixed(3)} MON)`}
                </button>
              </div>
            </div>
          )}

          {/* Participants & Timeline Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Agreement Participants */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Escrow Participants</h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Buyer:</span>
                  </span>
                  <Address address={escrow.buyer} size="xs" />
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Seller:</span>
                  </span>
                  <Address address={escrow.seller} size="xs" />
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <ScaleIcon className="w-3.5 h-3.5 text-violet-400" />
                    <span>Arbiter:</span>
                  </span>
                  <Address address={escrow.arbiter} size="xs" />
                </div>
              </div>
            </div>

            {/* Timeline & Security Details */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Contract Security & Deadline
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <ClockIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>Expiry Deadline:</span>
                  </span>
                  <span className="font-mono text-slate-200">
                    {new Date(deadline * 1000).toLocaleString()} ({isExpired ? "Expired" : `${daysLeft} days left`})
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900">
                  <span className="text-slate-400">Payment Currency:</span>
                  <span className="font-mono text-emerald-400">{isNative ? "Native MON" : escrow.token}</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900">
                  <span className="text-slate-400">Escrow Contract Status:</span>
                  <span className="font-medium text-slate-200">
                    {escrow.status === EscrowStatus.Completed ? "Fully Settled" : "Protected On-Chain"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Milestones Workflow Tracker */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <DocumentTextIcon className="w-4 h-4 text-emerald-400" />
                <span>Milestone Deliverables & Releases ({milestones.length})</span>
              </h3>
              <span className="text-xs text-slate-400">Independent stage execution</span>
            </div>

            <div className="space-y-3.5">
              {milestones.map((milestone, idx) => {
                const badge = getMilestoneStatusBadge(milestone.status);
                const hasProof =
                  milestone.proofHash &&
                  milestone.proofHash !== "0x0000000000000000000000000000000000000000000000000000000000000000";
                const isFormActive = activeMilestoneId === milestone.id;

                return (
                  <div
                    key={milestone.id}
                    className={`p-4 rounded-xl border transition-all ${
                      milestone.status === MilestoneStatus.Disputed
                        ? "bg-rose-950/20 border-rose-500/40"
                        : milestone.status === MilestoneStatus.Paid
                          ? "bg-slate-950/60 border-emerald-500/30"
                          : "bg-slate-950/90 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {/* Milestone Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-200 text-xs font-bold flex items-center justify-center border border-slate-700">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-bold text-sm text-white">Milestone #{idx + 1}</span>
                          <span className="ml-2 font-mono font-bold text-emerald-400 text-xs">
                            {Number(formatEther(milestone.amount)).toFixed(4)} MON
                          </span>
                        </div>
                      </div>

                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${badge.classes}`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Proof Deliverable info if present */}
                    {hasProof && (
                      <div className="mb-3 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
                        <div className="flex items-center justify-between text-slate-400 mb-1">
                          <span className="text-[11px] font-medium flex items-center gap-1">
                            <ClipboardDocumentCheckIcon className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Deliverable Proof Hash:</span>
                          </span>
                          {milestone.submittedAt > 0n && (
                            <span className="text-[10px] text-slate-500">
                              Submitted: {new Date(Number(milestone.submittedAt) * 1000).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-cyan-300 break-all text-[11px] bg-slate-950 p-1.5 rounded border border-slate-800/80">
                          {milestone.proofHash}
                        </div>
                      </div>
                    )}

                    {/* Active Deliverable Submission Form for Seller */}
                    {isFormActive && (
                      <div className="my-3 p-3.5 rounded-xl bg-slate-900 border border-emerald-500/40 space-y-2.5 animate-fadeIn">
                        <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                          <SparklesIcon className="w-4 h-4 text-emerald-400" />
                          <span>Submit Work Proof / Deliverable for Milestone #{idx + 1}</span>
                        </div>

                        <textarea
                          rows={2}
                          value={proofInput}
                          onChange={e => setProofInput(e.target.value)}
                          placeholder="Enter deliverable description, GitHub PR URL, IPFS Hash, or raw bytes32 hash..."
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:border-emerald-500 focus:outline-none"
                        />

                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMilestoneId(null);
                              setProofInput("");
                            }}
                            className="btn btn-ghost btn-xs text-slate-400"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleSubmitMilestone(milestone.id, milestone.status === MilestoneStatus.Rejected)
                            }
                            disabled={isSubmittingProof}
                            className="btn btn-primary btn-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold border-0"
                          >
                            {isSubmittingProof ? "Submitting..." : "Confirm & Submit On-Chain"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Dispute Resolution Tool (for Arbiter) */}
                    {milestone.status === MilestoneStatus.Disputed && (
                      <div className="my-3 p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/50 space-y-3">
                        <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
                          <ScaleIcon className="w-4 h-4 text-rose-400" />
                          <span>Milestone Under Dispute Arbitration</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          A dispute was raised by one of the participants. The Arbiter has sole authority to resolve
                          this milestone by splitting the{" "}
                          <strong>{Number(formatEther(milestone.amount)).toFixed(4)} MON</strong> between Seller and
                          Buyer.
                        </p>

                        {isArbiter ? (
                          <div className="space-y-3 pt-2 border-t border-rose-500/20">
                            <div className="flex items-center justify-between text-xs text-slate-300">
                              <span>Arbitration Split Allocation:</span>
                              <span className="font-bold text-white">
                                {sellerSplitPercent}% Seller / {100 - sellerSplitPercent}% Buyer
                              </span>
                            </div>

                            {/* Split Slider */}
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={sellerSplitPercent}
                              onChange={e => setSellerSplitPercent(Number(e.target.value))}
                              className="w-full accent-rose-500 cursor-pointer"
                            />

                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                                <span className="text-slate-400 block text-[10px]">Seller Receives:</span>
                                <span className="font-mono font-bold text-emerald-400">
                                  {((Number(formatEther(milestone.amount)) * sellerSplitPercent) / 100).toFixed(4)} MON
                                </span>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                                <span className="text-slate-400 block text-[10px]">Buyer Refunded:</span>
                                <span className="font-mono font-bold text-cyan-400">
                                  {((Number(formatEther(milestone.amount)) * (100 - sellerSplitPercent)) / 100).toFixed(
                                    4,
                                  )}{" "}
                                  MON
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleResolveDispute(milestone)}
                              disabled={isPending}
                              className="w-full btn btn-sm bg-rose-600 hover:bg-rose-500 text-white font-bold border-0"
                            >
                              {isPending ? "Executing Resolution..." : "Confirm & Execute Dispute Settlement"}
                            </button>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic">
                            Awaiting Arbiter ({escrow.arbiter.slice(0, 8)}...) to submit decision.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Interactive Action Buttons per Milestone */}
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-white/5">
                      {/* Seller: Submit Deliverable (When Pending) */}
                      {isSeller &&
                        milestone.status === MilestoneStatus.Pending &&
                        (escrow.status === EscrowStatus.Funded || escrow.status === EscrowStatus.InProgress) &&
                        !isExpired && (
                          <button
                            onClick={() => {
                              setActiveMilestoneId(milestone.id);
                              setProofInput("");
                            }}
                            className="btn btn-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold border-0 gap-1"
                          >
                            <SparklesIcon className="w-3.5 h-3.5" />
                            <span>Submit Deliverable</span>
                          </button>
                        )}

                      {/* Seller: Resubmit Deliverable (When Rejected) */}
                      {isSeller &&
                        milestone.status === MilestoneStatus.Rejected &&
                        (escrow.status === EscrowStatus.Funded || escrow.status === EscrowStatus.InProgress) &&
                        !isExpired && (
                          <button
                            onClick={() => {
                              setActiveMilestoneId(milestone.id);
                              setProofInput("");
                            }}
                            className="btn btn-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border-0 gap-1"
                          >
                            <ArrowPathIcon className="w-3.5 h-3.5" />
                            <span>Resubmit Deliverable</span>
                          </button>
                        )}

                      {/* Buyer: Approve Deliverable (When Submitted) */}
                      {isBuyer && milestone.status === MilestoneStatus.Submitted && !isExpired && (
                        <>
                          <button
                            onClick={() => handleRejectMilestone(milestone.id)}
                            disabled={isPending}
                            className="btn btn-xs bg-amber-950/50 hover:bg-amber-900/70 text-amber-300 border border-amber-500/40 gap-1"
                          >
                            <XCircleIcon className="w-3.5 h-3.5" />
                            <span>Request Revision</span>
                          </button>

                          <button
                            onClick={() => handleApproveMilestone(milestone.id)}
                            disabled={isPending}
                            className="btn btn-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold border-0 gap-1"
                          >
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                            <span>Approve Deliverable</span>
                          </button>
                        </>
                      )}

                      {/* Anyone / Buyer: Release Payment (When Approved) */}
                      {milestone.status === MilestoneStatus.Approved && (
                        <button
                          onClick={() => handleReleaseMilestone(milestone.id)}
                          disabled={isPending}
                          className="btn btn-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold border-0 gap-1"
                        >
                          <CurrencyDollarIcon className="w-3.5 h-3.5" />
                          <span>Release {Number(formatEther(milestone.amount)).toFixed(3)} MON to Seller</span>
                        </button>
                      )}

                      {/* Dispute button for Participant (Buyer or Seller) */}
                      {(isBuyer || isSeller) &&
                        (milestone.status === MilestoneStatus.Submitted ||
                          milestone.status === MilestoneStatus.Approved) &&
                        escrow.status !== EscrowStatus.Completed && (
                          <button
                            onClick={() => handleRaiseDispute(milestone.id)}
                            disabled={isPending}
                            className="btn btn-xs bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 gap-1"
                          >
                            <ScaleIcon className="w-3.5 h-3.5 text-rose-400" />
                            <span>Raise Dispute</span>
                          </button>
                        )}

                      {/* Buyer: Claim Deadline Refund if deadline passed */}
                      {isBuyer &&
                        isExpired &&
                        milestone.status !== MilestoneStatus.Paid &&
                        milestone.status !== MilestoneStatus.Refunded &&
                        milestone.status !== MilestoneStatus.Disputed && (
                          <button
                            onClick={() => handleRefundMilestone(milestone.id)}
                            disabled={isPending}
                            className="btn btn-xs bg-purple-950/50 hover:bg-purple-900/70 text-purple-300 border border-purple-500/40 gap-1"
                          >
                            <ArrowUpRightIcon className="w-3.5 h-3.5" />
                            <span>Claim Deadline Refund</span>
                          </button>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-white/10 bg-[#121624]">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Escrow #{escrow.id.toString()}</span>
            <span>·</span>
            <span>
              {milestones.filter(m => m.status === MilestoneStatus.Paid).length} of {milestones.length} Paid
            </span>
          </div>

          <button onClick={onClose} className="btn btn-ghost btn-sm text-slate-400 hover:text-white">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
