import type { FinancialData, RunwayResult, MonthProjection } from '../types';

export function calculateRunway(data: FinancialData): RunwayResult {
  // Living expenses (excluding debt - these continue after debt paid off)
  const livingExpenses =
    data.rent +
    data.utilities +
    data.groceries +
    data.subscriptions +
    data.transport +
    data.pocketMoney;
  
  // Total expenses (including debt - only during saving phase)
  const monthlyExpenses = livingExpenses + data.monthlyDebtRepayment;

  const monthlySurplus = data.monthlyIncome - monthlyExpenses;
  const projections: MonthProjection[] = [];
  
  let savingsBalance = data.currentSavings;
  const today = new Date();
  const maxMonths = 240; // 20 years max projection
  
  // Phase thresholds (months of expenses) - from user config
  const cautionThreshold = data.cautionThreshold;
  const criticalThreshold = data.criticalThreshold;
  
  let lastSafeDate: Date | null = null;
  let depletionDate: Date | null = null;
  
  // Calculate recommended cutoff based on target savings AND debt payoff
  // Total monthly savings rate = explicit contribution + any surplus
  const totalMonthlySavings = data.monthlySavingsContribution + monthlySurplus;
  const monthsToReachTarget = totalMonthlySavings > 0 && data.currentSavings < data.emergencyFundTarget
    ? Math.ceil((data.emergencyFundTarget - data.currentSavings) / totalMonthlySavings)
    : 0;
  
  // How many months to pay off all debt
  const monthsToPayOffDebt = data.monthlyDebtRepayment > 0 && data.totalDebt > 0
    ? Math.ceil(data.totalDebt / data.monthlyDebtRepayment)
    : 0;
  
  // Cutoff is when BOTH conditions met: target reached AND debt paid off
  const monthsUntilCutoff = Math.max(monthsToReachTarget, monthsToPayOffDebt);
  
  // Calculate individual milestone dates
  let targetReachedDate: Date | null = null;
  let debtFreeDate: Date | null = null;
  
  if (data.currentSavings >= data.emergencyFundTarget) {
    targetReachedDate = today; // Already at target
  } else if (monthsToReachTarget > 0) {
    targetReachedDate = new Date(today);
    targetReachedDate.setMonth(targetReachedDate.getMonth() + monthsToReachTarget);
  }
  
  if (data.totalDebt <= 0) {
    debtFreeDate = today; // Already debt-free
  } else if (monthsToPayOffDebt > 0) {
    debtFreeDate = new Date(today);
    debtFreeDate.setMonth(debtFreeDate.getMonth() + monthsToPayOffDebt);
  }
  
  // Date when ready to switch to consumption mode (both conditions met)
  if (monthsUntilCutoff > 0) {
    lastSafeDate = new Date(today);
    lastSafeDate.setMonth(lastSafeDate.getMonth() + monthsUntilCutoff);
  } else if (data.currentSavings >= data.emergencyFundTarget && data.totalDebt <= 0) {
    // Already at target and debt-free
    lastSafeDate = today;
  }
  
  const phases = {
    comfortable: { start: today, end: null as Date | null },
    caution: { start: null as Date | null, end: null as Date | null },
    critical: { start: null as Date | null, end: null as Date | null },
  };

  // Track if we've hit the target AND paid off debt → ready for consumption mode
  let targetReached = data.currentSavings >= data.emergencyFundTarget;
  let debtPaidOff = data.totalDebt <= 0;
  let consumptionStarted = targetReached && debtPaidOff;
  let remainingDebt = data.totalDebt;

  for (let month = 0; month < maxMonths; month++) {
    const date = new Date(today);
    date.setMonth(date.getMonth() + month);
    
    // Check if we reached target this month
    if (!targetReached && savingsBalance >= data.emergencyFundTarget) {
      targetReached = true;
    }
    
    // Check if debt paid off this month
    if (!debtPaidOff && remainingDebt <= 0) {
      debtPaidOff = true;
    }
    
    // Start consumption only when BOTH conditions met
    if (!consumptionStarted && targetReached && debtPaidOff) {
      consumptionStarted = true;
    }
    
    // Calculate months of runway at current balance
    // Use living expenses (no debt) if in consumption mode, otherwise total expenses
    const currentExpenses = consumptionStarted ? livingExpenses : monthlyExpenses;
    const monthsOfRunway = currentExpenses > 0 ? savingsBalance / currentExpenses : Infinity;
    
    let phase: MonthProjection['phase'];
    if (savingsBalance <= 0) {
      phase = 'depleted';
      if (!depletionDate) depletionDate = date;
    } else if (!consumptionStarted) {
      // Still in saving phase - comfortable
      phase = 'comfortable';
    } else if (monthsOfRunway > cautionThreshold) {
      phase = 'comfortable';
    } else if (monthsOfRunway > criticalThreshold) {
      phase = 'caution';
      if (!phases.caution.start) phases.caution.start = date;
    } else {
      // Below caution threshold = critical
      phase = 'critical';
      if (!phases.critical.start) phases.critical.start = date;
    }
    
    // Track phase transitions
    if (phase !== 'comfortable' && !phases.comfortable.end) {
      phases.comfortable.end = new Date(date);
      phases.comfortable.end.setMonth(phases.comfortable.end.getMonth() - 1);
    }
    if (phase === 'critical' && phases.caution.start && !phases.caution.end) {
      phases.caution.end = new Date(date);
      phases.caution.end.setMonth(phases.caution.end.getMonth() - 1);
    }
    if (phase === 'depleted' && phases.critical.start && !phases.critical.end) {
      phases.critical.end = new Date(date);
      phases.critical.end.setMonth(phases.critical.end.getMonth() - 1);
    }
    
    const projIncome = consumptionStarted ? 0 : data.monthlyIncome;
    const projExpenses = consumptionStarted ? livingExpenses : monthlyExpenses;
    const projDebtPaid = consumptionStarted ? 0 : (remainingDebt > 0 ? Math.min(data.monthlyDebtRepayment, remainingDebt + data.monthlyDebtRepayment) : 0);
    const projNetChange = consumptionStarted ? -livingExpenses : monthlySurplus;

    projections.push({
      month,
      date,
      savingsBalance: Math.max(0, savingsBalance),
      phase,
      mode: consumptionStarted ? 'consumption' : 'saving',
      income: projIncome,
      expenses: projExpenses,
      debtPaid: projDebtPaid,
      netChange: projNetChange,
    });
    
    // Update balance for next month based on current mode
    if (consumptionStarted) {
      // After target reached AND debt paid: consume savings (no income, no debt payment)
      savingsBalance -= livingExpenses;
    } else {
      // Before ready: save contribution + any surplus
      savingsBalance += data.monthlySavingsContribution + monthlySurplus;
      remainingDebt -= data.monthlyDebtRepayment;
    }
    
    // Stop if depleted
    if (savingsBalance <= 0 && depletionDate) break;
  }
  
  // Calculate runway months (how long savings last if income stops today)
  // Use living expenses since debt would be paid off in consumption mode
  const runwayMonths = livingExpenses > 0 
    ? Math.floor(data.currentSavings / livingExpenses)
    : Infinity;
  
  // How long target savings will last when spending begins (no debt payments)
  const targetRunwayMonths = livingExpenses > 0
    ? Math.floor(data.emergencyFundTarget / livingExpenses)
    : Infinity;

  return {
    monthlyExpenses,
    livingExpenses,
    monthlyIncome: data.monthlyIncome,
    monthlySurplus,
    runwayMonths,
    targetRunwayMonths,
    monthsToReachTarget: monthsToReachTarget === Infinity ? null : monthsToReachTarget,
    monthsToPayOffDebt: monthsToPayOffDebt === 0 ? null : monthsToPayOffDebt,
    targetReachedDate,
    debtFreeDate,
    lastSafeDate,
    depletionDate,
    projections,
    phases,
  };
}

const EXPORT_VERSION = 1;
const STORAGE_KEY = 'whenimbroke-data';
const STORAGE_VERSION = 1;

export function loadFromStorage(): FinancialData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { version: number; data: FinancialData };
    if (parsed.version !== STORAGE_VERSION) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function saveToStorage(data: FinancialData): void {
  try {
    const payload = { version: STORAGE_VERSION, data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota errors
  }
}

export function exportData(data: FinancialData): void {
  const payload = { version: EXPORT_VERSION, exportedAt: new Date().toISOString(), data };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `whenimbroke-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

const REQUIRED_KEYS: (keyof FinancialData)[] = [
  'currentSavings', 'monthlyIncome', 'monthlySavingsContribution', 'emergencyFundTarget',
  'rent', 'utilities', 'groceries', 'subscriptions', 'transport', 'pocketMoney',
  'totalDebt', 'monthlyDebtRepayment',
  'comfortableThreshold', 'cautionThreshold', 'criticalThreshold',
];

export function validateAndParseImport(json: string): FinancialData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Invalid JSON file.');
  }

  const obj = parsed as Record<string, unknown>;
  const candidate = (obj.data ?? obj) as Record<string, unknown>;

  for (const key of REQUIRED_KEYS) {
    if (typeof candidate[key] !== 'number') {
      throw new Error(`Missing or invalid field: ${key}`);
    }
  }

  return candidate as unknown as FinancialData;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | null): string {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    year: 'numeric',
  }).format(date);
}
