export type UserRole = 'admin' | 'employee';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  fullName: string;
  employeeCode?: string;
}

export interface TargetMilestoneProgress {
  order: number;
  amountPaise: number;
  label: string;
  status: 'completed' | 'current' | 'upcoming';
  percentage: number;
}

export interface TargetProgressSnapshot {
  cycleSalesPaise: number;
  initialTargetPaise: number;
  activeTargetPaise: number;
  activeTargetLabel: string;
  achievedInActiveTargetPaise: number;
  remainingForActiveTargetPaise: number;
  percentageCompleted: number;
  remainingDays: number;
  dailyRequiredSalesPaise: number;
  allMilestonesCompleted: boolean;
  milestones: TargetMilestoneProgress[];
  motivationalMessage: string;
}

export interface SalesEntryItem {
  _id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  cycleKey: string;
  orderName: string;
  productName: string;
  amountPaise: number;
  commissionRateBps: number;
  commissionPaise: number;
  entryDateIST: string;
  entryTimeIST: string;
  entryTimestamp: string;
  status: 'active' | 'edited' | 'deleted';
}

export interface WithdrawalItem {
  _id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  cycleKey?: string;
  amountPaise: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  requestedAt: string;
  requestDateIST: string;
  employeeNote: string;
  reviewedAt?: string;
  reviewedByName?: string;
  rejectionReason?: string;
  paidAt?: string;
  paidByName?: string;
  paymentMethod?: string;
  paymentReference?: string;
  paymentNotes?: string;
}

export interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface TargetAchievementItem {
  _id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  cycleId: string;
  cycleKey: string;
  milestoneAmountPaise: number;
  milestoneLabel: string;
  achievedAtSalesPaise: number;
  achievedAt: string;
  incentiveGranted: boolean;
}
