import { useState } from 'react';
import { MapPin, Target, AlertTriangle, Wallet, PiggyBank, TrendingUp } from 'lucide-react';
import type { FinancialData, RunwayResult } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatting';
import { Section } from '../ui';
import { InfoModal } from './InfoModal';

interface ProjectionSectionProps {
  result: RunwayResult;
  data: FinancialData;
}

export function ProjectionSection({ result, data }: ProjectionSectionProps) {
  const [showInfo, setShowInfo] = useState(false);
  const today = new Date();
  
  // Calculate durations
  const monthsBetween = (start: Date | null, end: Date | null) => {
    if (!start || !end) return null;
    return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  };
  
  const monthsFromNow = (date: Date | null) => {
    if (!date) return null;
    return Math.max(0, Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  };

  // Phase durations
  const savingPhaseDuration = monthsFromNow(result.lastSafeDate);
  
  // Saving phase sub-durations
  const preDebtDuration = result.phases.saving.preDebt.start
    ? monthsBetween(result.phases.saving.preDebt.start, result.phases.saving.preDebt.end ?? result.lastSafeDate)
    : null;
  const postDebtDuration = result.phases.saving.postDebt.start
    ? monthsBetween(result.phases.saving.postDebt.start, result.phases.saving.postDebt.end ?? result.lastSafeDate)
    : null;
  
  const comfortableDuration = result.phases.comfortable.end 
    ? monthsBetween(result.lastSafeDate, result.phases.comfortable.end)
    : null;
  const cautionDuration = monthsBetween(result.phases.caution.start, result.phases.caution.end);
  const criticalDuration = monthsBetween(result.phases.critical.start, result.phases.critical.end);
  
  // Total runway after switching to consumption
  const totalConsumptionRunway = result.targetRunwayMonths;

  // Duration of consumption phase (lastSafeDate → depletionDate)
  const consumptionDuration = monthsBetween(result.lastSafeDate, result.depletionDate);
  // Comfortable duration during consumption (fallback: all of consumption if no phase transition)
  const consumptionComfortableDuration = comfortableDuration ?? consumptionDuration;

  return (
    <>
    {showInfo && <InfoModal onClose={() => setShowInfo(false)} data={data} />}
    <Section title="Survival projection" onInfoClick={() => setShowInfo(true)}>
      
      {/* Key Milestones */}
      <div className="milestone-section">
        <div className="milestone-header">Key Milestones</div>
        
        <div className="milestone-item">
          <div className="milestone-icon"><MapPin size={18} /></div>
          <div className="milestone-content">
            <div className="milestone-title">Today</div>
            <div className="milestone-detail">
              {formatDate(today)} · Savings: {formatCurrency(data.currentSavings)} · Runway: {result.runwayMonths === Infinity ? '∞' : `${result.runwayMonths} mo`}
            </div>
          </div>
        </div>

        {/* Debt-Free Milestone */}
        {data.totalDebt > 0 && result.debtFreeDate && (
          <div className="milestone-item">
            <div className="milestone-icon"><Wallet size={18} /></div>
            <div className="milestone-content">
              <div className="milestone-title">Debt-Free</div>
              <div className="milestone-detail">
                {formatDate(result.debtFreeDate)}
                {result.monthsToPayOffDebt && result.monthsToPayOffDebt > 0 && (
                  <span className="badge" style={{ marginLeft: '8px' }}>{result.monthsToPayOffDebt} mo away</span>
                )}
              </div>
              <div className="milestone-sub">Total debt: {formatCurrency(data.totalDebt)} at {formatCurrency(data.monthlyDebtRepayment)}/mo</div>
            </div>
          </div>
        )}

        {/* Target Savings Milestone */}
        {result.targetReachedDate && data.currentSavings < data.savingsTarget && (
          <div className="milestone-item">
            <div className="milestone-icon"><PiggyBank size={18} /></div>
            <div className="milestone-content">
              <div className="milestone-title">Target Savings Reached</div>
              <div className="milestone-detail">
                {formatDate(result.targetReachedDate)}
                {result.monthsToReachTarget && result.monthsToReachTarget > 0 && (
                  <span className="badge" style={{ marginLeft: '8px' }}>{result.monthsToReachTarget} mo away</span>
                )}
              </div>
              <div className="milestone-sub">Target: {formatCurrency(data.savingsTarget)} · Need: {formatCurrency(data.savingsTarget - data.currentSavings)}</div>
            </div>
          </div>
        )}

        {/* Ready for Consumption Mode */}
        {result.lastSafeDate && (
          <div className="milestone-item">
            <div className="milestone-icon"><Target size={18} color="var(--color-ok)" /></div>
            <div className="milestone-content">
              <div className="milestone-title">Ready for Consumption Mode</div>
              <div className="milestone-detail">
                {formatDate(result.lastSafeDate)}
                {savingPhaseDuration !== null && savingPhaseDuration > 0 && (
                  <span className="badge ok" style={{ marginLeft: '8px' }}>{savingPhaseDuration} mo away</span>
                )}
              </div>
              <div className="milestone-sub">Target reached & debt-free · Peak savings: {formatCurrency(data.savingsTarget)}</div>
              {consumptionDuration !== null && (
                <div className="milestone-sub">Consumption runway: {consumptionDuration} months · Burn rate: {formatCurrency(result.livingExpenses)}/mo</div>
              )}
            </div>
          </div>
        )}
        
        {result.depletionDate && (
          <div className="milestone-item">
            <div className="milestone-icon"><AlertTriangle size={18} color="var(--color-danger)" /></div>
            <div className="milestone-content">
              <div className="milestone-title">Savings Depleted</div>
              <div className="milestone-detail">
                {formatDate(result.depletionDate)}
                <span className="badge danger" style={{ marginLeft: '8px' }}>{monthsFromNow(result.depletionDate)} mo away</span>
              </div>
              <div className="milestone-sub">Total runway from today: {monthsFromNow(result.depletionDate)} months · Burn rate: {formatCurrency(result.livingExpenses)}/mo</div>
              <div className="milestone-sub">
                {[
                  consumptionComfortableDuration ? `Comfortable: ${consumptionComfortableDuration} mo` : null,
                  cautionDuration ? `Caution: ${cautionDuration} mo` : null,
                  criticalDuration ? `Critical: ${criticalDuration} mo` : null,
                ].filter(Boolean).join(' · ')}
              </div>
            </div>
          </div>
        )}
        
        {!result.depletionDate && (
          <div className="milestone-item">
            <div className="milestone-icon"><TrendingUp size={18} color="var(--color-ok)" /></div>
            <div className="milestone-content">
              <div className="milestone-title">Sustainable</div>
              <div className="milestone-detail">Savings will not deplete within 20 years</div>
            </div>
          </div>
        )}
      </div>

      {/* Phase Breakdown */}
      <div className="phase-section">
        <div className="milestone-header">Phase Breakdown</div>
        
        {/* Saving Phase */}
        <div className="phase-block">
          <div className="phase-block-header">
            <span className="phase-block-title">Phase 1: Saving Mode</span>
            {savingPhaseDuration !== null && savingPhaseDuration > 0 && (
              <span className="phase-block-duration">{savingPhaseDuration} months</span>
            )}
          </div>
          <div className="phase-block-details">
            <div>Now → {result.lastSafeDate ? formatDate(result.lastSafeDate) : 'Ongoing'}</div>
            <div className="phase-block-sub">Income covers expenses · Building savings</div>
          </div>
        </div>

        {/* Pre-Debt Sub-Phase */}
        {data.totalDebt > 0 && (
          <div className="phase-block sub-phase">
            <div className="phase-block-header">
              <span className="dot" style={{ background: 'var(--color-info, #3b82f6)' }} />
              <span className="phase-block-title">Pre-Debt (Saving + Paying Debt)</span>
              {preDebtDuration !== null && preDebtDuration > 0 && (
                <span className="phase-block-duration">{preDebtDuration} months</span>
              )}
            </div>
            <div className="phase-block-details">
              <div>
                {result.phases.saving.preDebt.start ? formatDate(result.phases.saving.preDebt.start) : 'Now'}
                {' → '}
                {result.phases.saving.preDebt.end
                  ? formatDate(result.phases.saving.preDebt.end)
                  : result.debtFreeDate
                    ? formatDate(result.debtFreeDate)
                    : result.lastSafeDate
                      ? formatDate(result.lastSafeDate)
                      : 'Ongoing'}
              </div>
              <div className="phase-block-sub">
                Surplus: {formatCurrency(result.monthlySavings)}/mo · Debt being paid down
              </div>
            </div>
          </div>
        )}

        {/* Post-Debt Sub-Phase (only if applicable) */}
        {data.totalDebt > 0 && result.phases.saving.postDebt.start && (
          <div className="phase-block sub-phase">
            <div className="phase-block-header">
              <span className="dot" style={{ background: 'var(--color-info-dark, #1d4ed8)' }} />
              <span className="phase-block-title">Post-Debt (Saving Only)</span>
              {postDebtDuration !== null && postDebtDuration > 0 && (
                <span className="phase-block-duration">{postDebtDuration} months</span>
              )}
            </div>
            <div className="phase-block-details">
              <div>
                {formatDate(result.phases.saving.postDebt.start)} → {' '}
                {result.phases.saving.postDebt.end
                  ? formatDate(result.phases.saving.postDebt.end)
                  : result.lastSafeDate
                    ? formatDate(result.lastSafeDate)
                    : 'Ongoing'}
              </div>
              <div className="phase-block-sub">
                Debt paid off · Full surplus going to savings
              </div>
            </div>
          </div>
        )}

        {/* Consumption Phases */}
        {result.lastSafeDate && (
          <>
            <div className="phase-block consumption-header">
              <div className="phase-block-header">
                <span className="phase-block-title">Phase 2: Consumption Mode</span>
              </div>
              <div className="phase-block-details">
                <div className="phase-block-sub">No income · Living off savings · No debt payments</div>
              </div>
            </div>

            <div className="phase-block sub-phase">
              <div className="phase-block-header">
                <span className="dot" style={{ background: 'var(--color-ok)' }} />
                <span className="phase-block-title">Comfortable</span>
                {comfortableDuration !== null && (
                  <span className="phase-block-duration">{comfortableDuration} months</span>
                )}
              </div>
              <div className="phase-block-details">
                <div>
                  {formatDate(result.lastSafeDate)} → {result.phases.comfortable.end ? formatDate(result.phases.comfortable.end) : 'Ongoing'}
                </div>
                <div className="phase-block-sub">Runway &gt; {data.cautionThreshold} months</div>
              </div>
            </div>

            {result.phases.caution.start && (
              <div className="phase-block sub-phase">
                <div className="phase-block-header">
                  <span className="dot" style={{ background: 'var(--color-warn)' }} />
                  <span className="phase-block-title">Caution</span>
                  {cautionDuration !== null && (
                    <span className="phase-block-duration">{cautionDuration} months</span>
                  )}
                </div>
                <div className="phase-block-details">
                  <div>
                    {formatDate(result.phases.caution.start)} → {result.phases.caution.end ? formatDate(result.phases.caution.end) : 'Ongoing'}
                  </div>
                  <div className="phase-block-sub">{data.criticalThreshold+1}-{data.cautionThreshold} months runway</div>
                </div>
              </div>
            )}

            {result.phases.critical.start && (
              <div className="phase-block sub-phase">
                <div className="phase-block-header">
                  <span className="dot" style={{ background: 'var(--color-danger)' }} />
                  <span className="phase-block-title">Critical</span>
                  {criticalDuration !== null && (
                    <span className="phase-block-duration">{criticalDuration} months</span>
                  )}
                </div>
                <div className="phase-block-details">
                  <div>
                    {formatDate(result.phases.critical.start)} → {result.phases.critical.end ? formatDate(result.phases.critical.end) : 'Ongoing'}
                  </div>
                  <div className="phase-block-sub">0-{data.criticalThreshold} months runway · Action needed</div>
                </div>
              </div>
            )}

            {result.depletionDate && (
              <div className="phase-block sub-phase">
                <div className="phase-block-header">
                  <span className="dot" style={{ background: 'var(--color-border-tertiary)' }} />
                  <span className="phase-block-title">Depleted</span>
                </div>
                <div className="phase-block-details">
                  <div>{formatDate(result.depletionDate)}</div>
                  <div className="phase-block-sub">Savings exhausted · No runway remaining</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Summary Stats */}
      <div className="projection-summary">
        <div className="summary-stat">
          <div className="summary-label">Current runway</div>
          <div className="summary-value">{result.runwayMonths === Infinity ? '∞' : `${result.runwayMonths} mo`}</div>
        </div>
        <div className="summary-stat">
          <div className="summary-label">Consumption runway</div>
          <div className="summary-value">{totalConsumptionRunway === Infinity ? '∞' : `${totalConsumptionRunway} mo`}</div>
        </div>
        <div className="summary-stat">
          <div className="summary-label">Cost while saving</div>
          <div className="summary-value">{formatCurrency(result.monthlyExpenses)}/mo</div>
        </div>
        <div className="summary-stat">
          <div className="summary-label">Burn in consumption</div>
          <div className="summary-value">{formatCurrency(result.livingExpenses)}/mo</div>
        </div>
      </div>

    </Section>
    </>
  );
}
