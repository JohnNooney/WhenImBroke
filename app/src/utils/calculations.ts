import type { FinancialData, RunwayResult, MonthProjection } from '../types';

export function calculateRunway(data: FinancialData): RunwayResult {
  const monthlyExpenses =
    data.rent +
    data.utilities +
    data.groceries +
    data.subscriptions +
    data.transport +
    data.pocketMoney +
    data.monthlyDebtRepayment;

  const monthlySurplus = data.monthlyIncome - monthlyExpenses;
  const projections: MonthProjection[] = [];
  
  let savingsBalance = data.currentSavings;
  const today = new Date();
  const maxMonths = 240; // 20 years max projection
  
  // Phase thresholds (months of expenses)
  const comfortableThreshold = 12; // 12+ months = comfortable
  const cautionThreshold = 6;      // 6-12 months = caution
  const criticalThreshold = 3;     // 3-6 months = critical
  
  let lastSafeDate: Date | null = null;
  let depletionDate: Date | null = null;
  
  // Calculate recommended cutoff based on target savings AND debt payoff
  // How many months to reach target from current savings
  const monthsToReachTarget = monthlySurplus > 0 && data.currentSavings < data.emergencyFundTarget
    ? Math.ceil((data.emergencyFundTarget - data.currentSavings) / monthlySurplus)
    : 0;
  
  // How many months to pay off all debt
  const monthsToPayOffDebt = data.monthlyDebtRepayment > 0 && data.totalDebt > 0
    ? Math.ceil(data.totalDebt / data.monthlyDebtRepayment)
    : 0;
  
  // Cutoff is when BOTH conditions met: target reached AND debt paid off
  const monthsUntilCutoff = Math.max(monthsToReachTarget, monthsToPayOffDebt);
  
  // Date when ready to switch to consumption mode
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
    
    // Calculate months of runway at current balance (based on expenses)
    const monthsOfRunway = monthlyExpenses > 0 ? savingsBalance / monthlyExpenses : Infinity;
    
    let phase: MonthProjection['phase'];
    if (savingsBalance <= 0) {
      phase = 'depleted';
      if (!depletionDate) depletionDate = date;
    } else if (!consumptionStarted) {
      // Still in saving phase - comfortable
      phase = 'comfortable';
    } else if (monthsOfRunway >= comfortableThreshold) {
      phase = 'comfortable';
    } else if (monthsOfRunway >= cautionThreshold) {
      phase = 'caution';
      if (!phases.caution.start) phases.caution.start = date;
    } else if (monthsOfRunway >= criticalThreshold) {
      phase = 'critical';
      if (!phases.critical.start) phases.critical.start = date;
    } else {
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
    
    projections.push({
      month,
      date,
      savingsBalance: Math.max(0, savingsBalance),
      phase,
    });
    
    // Update balance for next month based on current mode
    if (consumptionStarted) {
      // After target reached AND debt paid: consume savings (no income, no debt payment)
      const expensesWithoutDebt = monthlyExpenses - data.monthlyDebtRepayment;
      savingsBalance -= expensesWithoutDebt;
    } else {
      // Before ready: save surplus (includes debt repayment)
      savingsBalance += monthlySurplus;
      remainingDebt -= data.monthlyDebtRepayment;
    }
    
    // Stop if depleted
    if (savingsBalance <= 0 && depletionDate) break;
  }
  
  // Calculate runway months (how long savings last if income stops today)
  const runwayMonths = monthlyExpenses > 0 
    ? Math.floor(data.currentSavings / monthlyExpenses)
    : Infinity;
  
  // How long target savings will last when spending begins
  const targetRunwayMonths = monthlyExpenses > 0
    ? Math.floor(data.emergencyFundTarget / monthlyExpenses)
    : Infinity;

  return {
    monthlyExpenses,
    monthlyIncome: data.monthlyIncome,
    monthlySurplus,
    runwayMonths,
    targetRunwayMonths,
    monthsToReachTarget: monthsToReachTarget === Infinity ? null : monthsToReachTarget,
    lastSafeDate,
    depletionDate,
    projections,
    phases,
  };
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
