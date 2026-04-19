import type { FinancialData, RunwayResult, DerivedMetrics, ValueColor } from '../types';
import { formatDate } from './formatting';

// ── Shared helpers ──────────────────────────────────────────────

export function monthsFromNow(date: Date | null): number | null {
  if (!date) return null;
  const today = new Date();
  const months = (date.getFullYear() - today.getFullYear()) * 12 + (date.getMonth() - today.getMonth()) + 1;
  return Math.max(0, months);
}

export function monthsBetween(start: Date | null, end: Date | null): number | null {
  if (!start || !end) return null;
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
  return Math.max(0, months);
}

export function getValueColor(type: ValueColor): string {
  switch (type) {
    case 'ok': return 'var(--color-ok)';
    case 'warn': return 'var(--color-warn)';
    case 'danger': return 'var(--color-danger)';
    default: return 'var(--color-text-primary)';
  }
}

export function getSurplusColor(monthlySavings: number): ValueColor {
  if (monthlySavings > 500) return 'ok';
  if (monthlySavings > 0) return 'warn';
  return 'danger';
}

// ── Main derivation ─────────────────────────────────────────────

export function deriveMetrics(data: FinancialData, result: RunwayResult): DerivedMetrics {
  // Surplus & rates
  const surplusColor = getSurplusColor(result.monthlySavings);
  const savingsRate = data.monthlyIncome > 0
    ? Math.round((result.monthlySavings / data.monthlyIncome) * 100)
    : 0;
  const afterDebtSurplus = result.postDebtMonthlySavings;
  const isTargetMet = data.currentSavings >= data.savingsTarget && data.savingsTarget > 0;

  // Months-away values
  const monthsToDebtFree = monthsFromNow(result.debtFreeDate);
  const monthsToTargetReached = monthsFromNow(result.targetReachedDate);
  const monthsToLastSafe = monthsFromNow(result.lastSafeDate);
  const monthsToDepletion = monthsFromNow(result.depletionDate);

  // Next milestone — pick the soonest future date from all milestones
  const now = new Date();
  type Milestone = { label: string; value: string; sub: string; color: ValueColor; tooltip: string; date: Date };
  const candidates: Milestone[] = [];

  if (result.debtFreeDate && result.debtFreeDate > now && data.totalDebt > 0) {
    const mo = monthsToDebtFree ?? 0;
    candidates.push({ date: result.debtFreeDate, label: 'Debt-free', value: formatDate(result.debtFreeDate), sub: mo > 0 ? `${mo} mo away` : 'Now', color: 'warn', tooltip: 'When all debt will be paid off.' });
  }
  if (result.targetReachedDate && result.targetReachedDate > now && data.currentSavings < data.savingsTarget) {
    const mo = monthsToTargetReached ?? 0;
    candidates.push({ date: result.targetReachedDate, label: 'Target hit', value: formatDate(result.targetReachedDate), sub: mo > 0 ? `${mo} mo away` : 'Now', color: 'ok', tooltip: 'When savings reach your target.' });
  }
  if (result.lastSafeDate && result.lastSafeDate > now) {
    const mo = monthsToLastSafe ?? 0;
    candidates.push({ date: result.lastSafeDate, label: 'Ready', value: formatDate(result.lastSafeDate), sub: mo > 0 ? `${mo} mo away` : 'Now', color: 'ok', tooltip: 'Target reached & debt-free — ready to live off savings.' });
  }
  if (result.depletionDate) {
    const mo = monthsToDepletion ?? 0;
    candidates.push({ date: result.depletionDate, label: 'Breaks', value: formatDate(result.depletionDate), sub: `${mo} mo away`, color: 'danger', tooltip: 'When savings will run out at current spending.' });
  }

  candidates.sort((a, b) => a.date.getTime() - b.date.getTime());

  const nextMilestone: DerivedMetrics['nextMilestone'] = candidates.length > 0
    ? { label: candidates[0].label, value: candidates[0].value, sub: candidates[0].sub, color: candidates[0].color, tooltip: candidates[0].tooltip }
    : { label: 'Runway', value: '∞', sub: 'Sustainable', color: 'neutral', tooltip: 'Savings will not deplete within the 20-year projection window.' };

  // Phase durations
  const savingPhaseEnd = result.lastSafeDate ? new Date(result.lastSafeDate) : null;
  if (savingPhaseEnd) savingPhaseEnd.setMonth(savingPhaseEnd.getMonth() - 1);
  const savingPhaseDuration = monthsFromNow(savingPhaseEnd);

  const preDebtDuration = result.phases.saving.preDebt.start
    ? monthsBetween(result.phases.saving.preDebt.start, result.phases.saving.preDebt.end ?? savingPhaseEnd)
    : null;
  const postDebtDuration = result.phases.saving.postDebt.start
    ? monthsBetween(result.phases.saving.postDebt.start, result.phases.saving.postDebt.end ?? savingPhaseEnd)
    : null;

  const comfortableDuration = result.phases.comfortable.end
    ? monthsBetween(result.lastSafeDate, result.phases.comfortable.end)
    : null;
  const cautionDuration = monthsBetween(result.phases.caution.start, result.phases.caution.end);
  const criticalDuration = monthsBetween(result.phases.critical.start, result.phases.critical.end);

  const consumptionDuration = monthsBetween(result.lastSafeDate, result.depletionDate);
  const consumptionComfortableDuration = comfortableDuration ?? consumptionDuration;

  return {
    savingsRate,
    afterDebtSurplus,
    surplusColor,
    isTargetMet,
    nextMilestone,
    monthsToDebtFree,
    monthsToTargetReached,
    monthsToLastSafe,
    monthsToDepletion,
    savingPhaseEnd,
    savingPhaseDuration,
    preDebtDuration,
    postDebtDuration,
    comfortableDuration,
    cautionDuration,
    criticalDuration,
    consumptionDuration,
    consumptionComfortableDuration,
  };
}
