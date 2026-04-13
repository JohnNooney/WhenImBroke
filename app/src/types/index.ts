export interface FinancialData {
  // Savings & Income
  currentSavings: number;
  monthlyIncome: number;
  monthlySavingsContribution: number;
  emergencyFundTarget: number;

  // Monthly Expenses
  rent: number;
  utilities: number;
  groceries: number;
  subscriptions: number;
  transport: number;
  pocketMoney: number;

  // Debt
  totalDebt: number;
  monthlyDebtRepayment: number;

  // Phase thresholds (months of runway)
  comfortableThreshold: number;
  cautionThreshold: number;
  criticalThreshold: number;
}

export interface MonthProjection {
  month: number;
  date: Date;
  savingsBalance: number;
  phase: 'comfortable' | 'caution' | 'critical' | 'depleted';
}

export interface RunwayResult {
  monthlyExpenses: number;
  monthlyIncome: number;
  monthlySurplus: number;
  runwayMonths: number;
  targetRunwayMonths: number;
  monthsToReachTarget: number | null;
  monthsToPayOffDebt: number | null;
  targetReachedDate: Date | null;
  debtFreeDate: Date | null;
  lastSafeDate: Date | null;
  depletionDate: Date | null;
  projections: MonthProjection[];
  phases: {
    comfortable: { start: Date; end: Date | null };
    caution: { start: Date | null; end: Date | null };
    critical: { start: Date | null; end: Date | null };
  };
}

export interface Transaction {
  date: string;
  description: string;
  amount: number;
  category?: string;
}

export type BankFormat = 'monzo' | 'starling' | 'lloyds' | 'hsbc' | 'snoop' | 'unknown';

export interface SnoopTransaction extends Transaction {
  merchantName: string;
  snoopCategory: string;
  notes: string;
  accountProvider: string;
  accountName: string;
  status: string;
  subType: string;
}
