import { Address } from "viem";

export enum EscrowStatus {
  Created = 0,
  Funded = 1,
  InProgress = 2,
  Disputed = 3,
  Completed = 4,
  Cancelled = 5,
  Refunded = 6,
}

export enum MilestoneStatus {
  Pending = 0,
  Submitted = 1,
  Approved = 2,
  Rejected = 3,
  Paid = 4,
  Disputed = 5,
  Refunded = 6,
}

export type Milestone = {
  id: number;
  amount: bigint;
  proofHash: `0x${string}`;
  status: MilestoneStatus;
  submittedAt: bigint;
  resolvedAt: bigint;
  title?: string;
  description?: string;
};

export type Escrow = {
  id: bigint;
  buyer: Address;
  seller: Address;
  token: Address;
  totalAmount: bigint;
  depositedAmount: bigint;
  releasedAmount: bigint;
  refundedAmount: bigint;
  deadline: bigint;
  arbiter: Address;
  status: EscrowStatus;
  milestoneCount: bigint;
  milestones?: Milestone[];
};

export const ESCROW_STATUS_LABELS: Record<EscrowStatus, string> = {
  [EscrowStatus.Created]: "Created (Awaiting Deposit)",
  [EscrowStatus.Funded]: "Funded (Ready for Work)",
  [EscrowStatus.InProgress]: "In Progress",
  [EscrowStatus.Disputed]: "Disputed (Under Review)",
  [EscrowStatus.Completed]: "Completed",
  [EscrowStatus.Cancelled]: "Cancelled",
  [EscrowStatus.Refunded]: "Refunded",
};

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  [MilestoneStatus.Pending]: "Pending Delivery",
  [MilestoneStatus.Submitted]: "Submitted (Under Review)",
  [MilestoneStatus.Approved]: "Approved",
  [MilestoneStatus.Rejected]: "Revision Requested",
  [MilestoneStatus.Paid]: "Released / Paid",
  [MilestoneStatus.Disputed]: "In Dispute",
  [MilestoneStatus.Refunded]: "Refunded to Buyer",
};

export const getEscrowStatusBadge = (status: EscrowStatus) => {
  switch (status) {
    case EscrowStatus.Created:
      return {
        label: "Created",
        classes: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
        dot: "bg-amber-400",
      };
    case EscrowStatus.Funded:
      return {
        label: "Funded",
        classes: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30",
        dot: "bg-cyan-400 animate-pulse",
      };
    case EscrowStatus.InProgress:
      return {
        label: "In Progress",
        classes: "bg-blue-500/10 text-blue-400 border border-blue-500/30",
        dot: "bg-blue-400 animate-pulse",
      };
    case EscrowStatus.Disputed:
      return {
        label: "Disputed",
        classes: "bg-rose-500/10 text-rose-400 border border-rose-500/30",
        dot: "bg-rose-400 animate-ping",
      };
    case EscrowStatus.Completed:
      return {
        label: "Completed",
        classes: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
        dot: "bg-emerald-400",
      };
    case EscrowStatus.Cancelled:
      return {
        label: "Cancelled",
        classes: "bg-slate-500/10 text-slate-400 border border-slate-500/30",
        dot: "bg-slate-400",
      };
    case EscrowStatus.Refunded:
      return {
        label: "Refunded",
        classes: "bg-purple-500/10 text-purple-400 border border-purple-500/30",
        dot: "bg-purple-400",
      };
    default:
      return {
        label: "Unknown",
        classes: "bg-gray-500/10 text-gray-400 border border-gray-500/30",
        dot: "bg-gray-400",
      };
  }
};

export const getMilestoneStatusBadge = (status: MilestoneStatus) => {
  switch (status) {
    case MilestoneStatus.Pending:
      return {
        label: "Pending",
        classes: "bg-slate-800/80 text-slate-300 border border-slate-700",
      };
    case MilestoneStatus.Submitted:
      return {
        label: "Submitted",
        classes: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse",
      };
    case MilestoneStatus.Approved:
      return {
        label: "Approved",
        classes: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40",
      };
    case MilestoneStatus.Rejected:
      return {
        label: "Revision Needed",
        classes: "bg-amber-500/20 text-amber-300 border border-amber-500/40",
      };
    case MilestoneStatus.Paid:
      return {
        label: "Paid",
        classes: "bg-emerald-600/30 text-emerald-300 border border-emerald-500/50",
      };
    case MilestoneStatus.Disputed:
      return {
        label: "Disputed",
        classes: "bg-rose-500/20 text-rose-300 border border-rose-500/40",
      };
    case MilestoneStatus.Refunded:
      return {
        label: "Refunded",
        classes: "bg-purple-500/20 text-purple-300 border border-purple-500/40",
      };
    default:
      return {
        label: "Unknown",
        classes: "bg-gray-800 text-gray-400 border border-gray-700",
      };
  }
};
