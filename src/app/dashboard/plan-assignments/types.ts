// ─── Plan Assignments ──────────────────────────────────────────────────────
// Tracks what happens after a user purchases a plan: the system auto-assigns
// an online astrologer, and admin monitors the task through to delivery.

export type AssignmentStatus = "pending" | "working" | "delivered" | "cancelled";

export type PlanType = "subscription" | "question";

export interface ReassignmentHistoryEntry {
  fromAstrologerId: string | null;
  fromAstrologerName: string | null;
  toAstrologerId: string | null;
  toAstrologerName: string | null;
  reason: string;
  pointsDeducted: number;
  reassignedAt: string;
}

export interface PlanAssignment {
  _id: string;

  // Buyer
  userId: string;
  userName: string;
  userEmail: string;

  // What they bought
  planName: string;
  planType: PlanType;
  amount: number;
  purchasedAt: string; // ISO — when the user paid

  // Auto-assignment
  astrologerId: string | null;
  astrologerName: string | null;
  astrologerEmail: string | null;
  assignedAt: string | null; // ISO — when the system auto-assigned the astrologer

  // Lifecycle
  status: AssignmentStatus;
  startedAt?: string;   // astrologer opened/started the task
  deliveredAt?: string; // task completed & delivered to user
  cancelledAt?: string;
  cancelReason?: string;

  // Reassignment trail — who it moved from/to, when, why
  reassignmentCount?: number;
  reassignmentHistory?: ReassignmentHistoryEntry[];

  // SLA
  slaHours: number; // expected turnaround from assignment
}

export interface AssignmentSummary {
  total: number;
  pending: number;
  working: number;
  delivered: number;
  cancelled: number;
  avgCompletionSeconds: number | null;
}
