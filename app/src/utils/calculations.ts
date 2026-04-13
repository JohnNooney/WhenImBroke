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
  
  const phases = {
    comfortable: { start: today, end: null as Date | null },
    caution: { start: null as Date | null, end: null as Date | null },
    critical: { start: null as Date | null, end: null as Date | null },
  };

  for (let month = 0; month < maxMonths; month++) {
    const date = new Date(today);
    date.setMonth(date.getMonth() + month);
    
    // Calculate months of runway at current balance
    const monthsOfRunway = monthlyExpenses > 0 ? savingsBalance / monthlyExpenses : Infinity;
    
    let phase: MonthProjection['phase'];
    if (savingsBalance <= 0) {
      phase = 'depleted';
      if (!depletionDate) depletionDate = date;
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
    
    // Last safe point: latest date where stopping income still gives 6+ months runway
    if (monthlySurplus > 0 && savingsBalance >= monthlyExpenses * 6) {
      lastSafeDate = date;
    }
    
    projections.push({
      month,
      date,
      savingsBalance: Math.max(0, savingsBalance),
      phase,
    });
    
    // Update balance for next month
    savingsBalance += monthlySurplus;
    
    // Stop if depleted
    if (savingsBalance <= 0 && depletionDate) break;
  }
  
  // Calculate runway months (how long savings last if income stops today)
  const runwayMonths = monthlyExpenses > 0 
    ? Math.floor(data.currentSavings / monthlyExpenses)
    : Infinity;

  return {
    monthlyExpenses,
    monthlyIncome: data.monthlyIncome,
    monthlySurplus,
    runwayMonths,
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
