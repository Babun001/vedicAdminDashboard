import { PlanAssignment } from "./types";

// ─── Live API wiring ─────────────────────────────────────────────────────
// Backend: GET /api/admin/assignments (see adminAssignmentController.ts).
// It merges Reports + Questions into one row shape close to, but not
// identical to, PlanAssignment (it's a general-purpose contract shared by
// other consumers too) — this mapper is the only translation layer, so the
// rest of the page never has to know about the backend's field names.
export interface ApiAssignmentRow {
  type: "report" | "question";
  id: string;
  userId: string | null;
  clientName: string;
  clientEmail: string;
  planName: string;
  amount: number;
  astrologerId: string | null;
  astrologerName: string | null;
  astrologerEmail: string | null;
  status: string;
  displayStatus: "pending" | "working" | "delivered" | "cancelled";
  isQueued: boolean;
  assignedAt: string | null;
  dueAt: string | null;
  startedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  slaHours: number;
  workDurationSeconds: number;
  turnaroundSeconds: number | null;
  createdAt: string;
  reassignmentCount: number;
  reassignmentHistory: {
    fromAstrologerId: string | null;
    fromAstrologerName: string | null;
    toAstrologerId: string | null;
    toAstrologerName: string | null;
    reason: string;
    pointsDeducted: number;
    reassignedAt: string;
  }[];
}

export function mapApiAssignment(row: ApiAssignmentRow): PlanAssignment {
  return {
    _id: row.id,
    userId: row.userId ?? "",
    userName: row.clientName,
    userEmail: row.clientEmail,
    planName: row.planName,
    planType: row.type === "report" ? "subscription" : "question",
    amount: row.amount,
    purchasedAt: row.createdAt,
    astrologerId: row.astrologerId,
    astrologerName: row.astrologerName,
    astrologerEmail: row.astrologerEmail,
    assignedAt: row.assignedAt,
    status: row.displayStatus,
    startedAt: row.startedAt ?? undefined,
    deliveredAt: row.deliveredAt ?? undefined,
    cancelledAt: row.cancelledAt ?? undefined,
    cancelReason: row.cancelReason ?? undefined,
    slaHours: row.slaHours,
    reassignmentCount: row.reassignmentCount ?? 0,
    reassignmentHistory: row.reassignmentHistory ?? [],
  };
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
const minsAgo = (m: number) => new Date(Date.now() - m * 60 * 1000).toISOString();

export const mockAssignments: PlanAssignment[] = [
  {
    _id: "asg_001",
    userId: "u_101",
    userName: "Priya Sharma",
    userEmail: "priya.sharma@gmail.com",
    planName: "Divine Destiny Report",
    planType: "subscription",
    amount: 1999,
    purchasedAt: minsAgo(18),
    astrologerId: "ast_11",
    astrologerName: "Acharya Ramesh Joshi",
    astrologerEmail: "ramesh.joshi@cosmicremedies.com",
    assignedAt: minsAgo(17),
    status: "pending",
    slaHours: 24,
  },
  {
    _id: "asg_002",
    userId: "u_102",
    userName: "Rohit Verma",
    userEmail: "rohit.verma@yahoo.com",
    planName: "Basic Horoscope",
    planType: "subscription",
    amount: 499,
    purchasedAt: hoursAgo(3),
    astrologerId: "ast_04",
    astrologerName: "Pandit Suresh Nair",
    astrologerEmail: "suresh.nair@cosmicremedies.com",
    assignedAt: hoursAgo(3),
    status: "working",
    startedAt: hoursAgo(2),
    slaHours: 24,
  },
  {
    _id: "asg_003",
    userId: "u_103",
    userName: "Ananya Iyer",
    userEmail: "ananya.iyer@outlook.com",
    planName: "Ask 5 Questions",
    planType: "question",
    amount: 299,
    purchasedAt: hoursAgo(29),
    astrologerId: "ast_07",
    astrologerName: "Guruji Vikram Shastri",
    astrologerEmail: "vikram.shastri@cosmicremedies.com",
    assignedAt: hoursAgo(29),
    status: "delivered",
    startedAt: hoursAgo(28),
    deliveredAt: hoursAgo(21),
    slaHours: 24,
  },
  {
    _id: "asg_004",
    userId: "u_104",
    userName: "Karan Mehta",
    userEmail: "karan.mehta@gmail.com",
    planName: "Divine Destiny Report",
    planType: "subscription",
    amount: 1999,
    purchasedAt: hoursAgo(50),
    astrologerId: "ast_11",
    astrologerName: "Acharya Ramesh Joshi",
    astrologerEmail: "ramesh.joshi@cosmicremedies.com",
    assignedAt: hoursAgo(50),
    status: "delivered",
    startedAt: hoursAgo(49),
    deliveredAt: hoursAgo(31),
    slaHours: 24,
  },
  {
    _id: "asg_005",
    userId: "u_105",
    userName: "Sneha Kulkarni",
    userEmail: "sneha.kulkarni@gmail.com",
    planName: "Ask 1 Question",
    planType: "question",
    amount: 99,
    purchasedAt: hoursAgo(5),
    astrologerId: "ast_02",
    astrologerName: "Dr. Meera Bhatt",
    astrologerEmail: "meera.bhatt@cosmicremedies.com",
    assignedAt: hoursAgo(5),
    status: "cancelled",
    cancelledAt: hoursAgo(4),
    cancelReason: "User requested refund before work started",
    slaHours: 12,
  },
  {
    _id: "asg_006",
    userId: "u_106",
    userName: "Arjun Nair",
    userEmail: "arjun.nair@gmail.com",
    planName: "Basic Horoscope",
    planType: "subscription",
    amount: 499,
    purchasedAt: minsAgo(45),
    astrologerId: null,
    astrologerName: null,
    astrologerEmail: null,
    assignedAt: null,
    status: "pending",
    slaHours: 24,
  },
  {
    _id: "asg_007",
    userId: "u_107",
    userName: "Divya Reddy",
    userEmail: "divya.reddy@outlook.com",
    planName: "Divine Destiny Report",
    planType: "subscription",
    amount: 1999,
    purchasedAt: hoursAgo(75),
    astrologerId: "ast_04",
    astrologerName: "Pandit Suresh Nair",
    astrologerEmail: "suresh.nair@cosmicremedies.com",
    assignedAt: hoursAgo(75),
    status: "delivered",
    startedAt: hoursAgo(74),
    deliveredAt: hoursAgo(60),
    slaHours: 24,
  },
  {
    _id: "asg_008",
    userId: "u_108",
    userName: "Vikas Chauhan",
    userEmail: "vikas.chauhan@gmail.com",
    planName: "Ask 5 Questions",
    planType: "question",
    amount: 299,
    purchasedAt: hoursAgo(9),
    astrologerId: "ast_07",
    astrologerName: "Guruji Vikram Shastri",
    astrologerEmail: "vikram.shastri@cosmicremedies.com",
    assignedAt: hoursAgo(9),
    status: "working",
    startedAt: hoursAgo(8),
    slaHours: 24,
  },
  {
    _id: "asg_009",
    userId: "u_109",
    userName: "Neha Kapoor",
    userEmail: "neha.kapoor@yahoo.com",
    planName: "Basic Horoscope",
    planType: "subscription",
    amount: 499,
    purchasedAt: hoursAgo(120),
    astrologerId: "ast_02",
    astrologerName: "Dr. Meera Bhatt",
    astrologerEmail: "meera.bhatt@cosmicremedies.com",
    assignedAt: hoursAgo(120),
    status: "delivered",
    startedAt: hoursAgo(119),
    deliveredAt: hoursAgo(110),
    slaHours: 24,
  },
  {
    _id: "asg_010",
    userId: "u_110",
    userName: "Aditya Rao",
    userEmail: "aditya.rao@gmail.com",
    planName: "Ask 1 Question",
    planType: "question",
    amount: 99,
    purchasedAt: minsAgo(6),
    astrologerId: "ast_02",
    astrologerName: "Dr. Meera Bhatt",
    astrologerEmail: "meera.bhatt@cosmicremedies.com",
    assignedAt: minsAgo(5),
    status: "pending",
    slaHours: 12,
  },
  {
    _id: "asg_011",
    userId: "u_111",
    userName: "Ishita Sen",
    userEmail: "ishita.sen@gmail.com",
    planName: "Divine Destiny Report",
    planType: "subscription",
    amount: 1999,
    purchasedAt: hoursAgo(30),
    astrologerId: "ast_11",
    astrologerName: "Acharya Ramesh Joshi",
    astrologerEmail: "ramesh.joshi@cosmicremedies.com",
    assignedAt: hoursAgo(30),
    status: "working",
    startedAt: hoursAgo(28),
    slaHours: 24,
  },
  {
    _id: "asg_012",
    userId: "u_112",
    userName: "Manish Tiwari",
    userEmail: "manish.tiwari@outlook.com",
    planName: "Ask 5 Questions",
    planType: "question",
    amount: 299,
    purchasedAt: hoursAgo(15),
    astrologerId: "ast_04",
    astrologerName: "Pandit Suresh Nair",
    astrologerEmail: "suresh.nair@cosmicremedies.com",
    assignedAt: hoursAgo(15),
    status: "cancelled",
    cancelledAt: hoursAgo(10),
    cancelReason: "Astrologer went offline, reassignment pool exhausted",
    slaHours: 24,
  },
];
