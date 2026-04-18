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
  
  // Total expenses (including debt and savings contribution - only during saving phase)
  const monthlyExpenses = livingExpenses + data.monthlyDebtRepayment + data.monthlySavingsContribution;

  const monthlySavings = data.monthlyIncome - livingExpenses - data.monthlyDebtRepayment;
  // Surplus once debt is paid off: freed-up debt repayment flows into savings
  const postDebtMonthlySavings = monthlySavings + data.monthlyDebtRepayment;
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
  // Total monthly savings rate = surplus (contribution already deducted from income)
  const totalMonthlySavings = monthlySavings;
  const monthsToReachTarget = totalMonthlySavings > 0 && data.currentSavings < data.savingsTarget
    ? Math.ceil((data.savingsTarget - data.currentSavings) / totalMonthlySavings)
    : 0;
  
  // How many months to pay off all debt
  const monthsToPayOffDebt = data.monthlyDebtRepayment > 0 && data.totalDebt > 0
    ? Math.ceil(data.totalDebt / data.monthlyDebtRepayment)
    : 0;
  
  // Milestone dates will be set during loop simulation for accuracy
  let targetReachedDate: Date | null = data.currentSavings >= data.savingsTarget ? today : null;
  let debtFreeDate: Date | null = data.totalDebt <= 0 ? today : null;
  
  // lastSafeDate will be set during loop when consumption actually starts
  // This accounts for accelerated savings after debt payoff
  if (data.currentSavings >= data.savingsTarget && data.totalDebt <= 0) {
    // Already at target and debt-free
    lastSafeDate = today;
  }
  
  const phases = {
    comfortable: { start: today, end: null as Date | null },
    caution: { start: null as Date | null, end: null as Date | null },
    critical: { start: null as Date | null, end: null as Date | null },
    saving: {
      preDebt: { start: today, end: null as Date | null },
      postDebt: { start: null as Date | null, end: null as Date | null },
    },
  };

  // Track if we've hit the target AND paid off debt → ready for consumption mode
  let targetReached = data.currentSavings >= data.savingsTarget;
  let debtPaidOff = data.totalDebt <= 0;
  let consumptionStarted = targetReached && debtPaidOff;
  let remainingDebt = data.totalDebt;
  let debtJustPaidOff = false;

  for (let month = 0; month < maxMonths; month++) {
    const date = new Date(today);
    date.setMonth(date.getMonth() + month);
    
    // Check if we reached target this month
    if (!targetReached && savingsBalance >= data.savingsTarget) {
      targetReached = true;
      targetReachedDate = new Date(date);
    }
    
    // Check if debt paid off this month
    if (!debtPaidOff && remainingDebt <= 0) {
      debtFreeDate = new Date(date);
      debtPaidOff = true;
      debtJustPaidOff = true;
      // Track saving phase transition: preDebt -> postDebt
      if (!consumptionStarted) {
        // preDebt ends the month before postDebt starts (no overlap)
        const preDebtEnd = new Date(date);
        preDebtEnd.setMonth(preDebtEnd.getMonth() - 1);
        phases.saving.preDebt.end = preDebtEnd;
        phases.saving.postDebt.start = new Date(date);
      }
    }
    
    // Start consumption only when BOTH conditions met
    if (!consumptionStarted && targetReached && debtPaidOff) {
      consumptionStarted = true;
      lastSafeDate = new Date(date); // Set actual consumption start date
      // End the postDebt saving phase if it was active (ends month before consumption)
      if (phases.saving.postDebt.start && !phases.saving.postDebt.end) {
        const postDebtEnd = new Date(date);
        postDebtEnd.setMonth(postDebtEnd.getMonth() - 1);
        phases.saving.postDebt.end = postDebtEnd;
      }
      // Or end preDebt if debt paid off same month as target reached
      if (phases.saving.preDebt.start && !phases.saving.preDebt.end && debtJustPaidOff) {
        const preDebtEnd = new Date(date);
        preDebtEnd.setMonth(preDebtEnd.getMonth() - 1);
        phases.saving.preDebt.end = preDebtEnd;
      }
    }
    
    // Reset flag after processing
    debtJustPaidOff = false;
    
    // Calculate months of runway at current balance
    // During saving phase: living expenses + savings contribution + (debt if not paid off)
    // During consumption: just living expenses
    const currentExpenses = consumptionStarted
      ? livingExpenses
      : livingExpenses + data.monthlySavingsContribution + (debtPaidOff ? 0 : data.monthlyDebtRepayment);
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
    const projExpenses = livingExpenses;
    const projDebtPaid = consumptionStarted ? 0 : (debtPaidOff ? 0 : Math.min(data.monthlyDebtRepayment, remainingDebt + data.monthlyDebtRepayment));
    const projNetChange = consumptionStarted
      ? -livingExpenses
      : (remainingDebt <= 0 ? data.monthlyIncome - livingExpenses : monthlySavings);

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
      remainingDebt: Math.max(0, remainingDebt),
    });
    
    // Update balance for next month based on current mode
    if (consumptionStarted) {
      // After target reached AND debt paid: consume savings (no income, no debt payment)
      savingsBalance -= livingExpenses;
    } else {
      // Before ready: all surplus goes to savings
      // Once debt paid off, that payment becomes extra savings
      const actualMonthlySavings = remainingDebt <= 0
        ? data.monthlyIncome - livingExpenses
        : monthlySavings;
      savingsBalance += actualMonthlySavings;
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
  
  // Calculate target runway from simulation dates (inclusive month count)
  const targetRunwayMonths = (() => {
    if (!lastSafeDate || !depletionDate) return Infinity;
    const months = (depletionDate.getFullYear() - lastSafeDate.getFullYear()) * 12 
      + (depletionDate.getMonth() - lastSafeDate.getMonth()) + 1;
    return Math.max(0, months);
  })();

  return {
    monthlyExpenses,
    livingExpenses,
    monthlyIncome: data.monthlyIncome,
    monthlySavings,
    postDebtMonthlySavings,
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
