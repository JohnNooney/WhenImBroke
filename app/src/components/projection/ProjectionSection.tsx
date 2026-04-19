import { useState } from 'react';
import { MapPin, Target, AlertTriangle, Wallet, PiggyBank, TrendingUp } from 'lucide-react';
import type { FinancialData, RunwayResult, DerivedMetrics } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatting';
import { Section } from '../ui';
import { InfoModal } from './InfoModal';

interface ProjectionSectionProps {
  result: RunwayResult;
  data: FinancialData;
  derived: DerivedMetrics;
}

export function ProjectionSection({ result, data, derived }: ProjectionSectionProps) {
  const [showInfo, setShowInfo] = useState(false);

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
              {formatDate(new Date())} · Savings: {formatCurrency(data.currentSavings)} · Runway: {result.runwayMonths === Infinity ? '∞' : `${result.runwayMonths} mo`}
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
                {(derived.monthsToDebtFree ?? 0) > 0 && (
                  <span className="badge" style={{ marginLeft: '8px' }}>{derived.monthsToDebtFree} mo away</span>
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
                {(derived.monthsToTargetReached ?? 0) > 0 && (
                  <span className="badge" style={{ marginLeft: '8px' }}>{derived.monthsToTargetReached} mo away</span>
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
                {(derived.monthsToLastSafe ?? 0) > 0 && (
                  <span className="badge ok" style={{ marginLeft: '8px' }}>{derived.monthsToLastSafe} mo away</span>
                )}
              </div>
              <div className="milestone-sub">Target reached & debt-free · Peak savings: {formatCurrency(data.savingsTarget)}</div>
              {derived.consumptionDuration !== null && (
                <div className="milestone-sub">Consumption runway: {derived.consumptionDuration} months · Burn rate: {formatCurrency(result.livingExpenses)}/mo</div>
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
                <span className="badge danger" style={{ marginLeft: '8px' }}>{derived.monthsToDepletion} mo away</span>
              </div>
              <div className="milestone-sub">Total runway from today: {derived.monthsToDepletion} months · Burn rate: {formatCurrency(result.livingExpenses)}/mo</div>
              <div className="milestone-sub">
                {[
                  derived.consumptionComfortableDuration ? `Comfortable: ${derived.consumptionComfortableDuration} mo` : null,
                  derived.cautionDuration ? `Caution: ${derived.cautionDuration} mo` : null,
                  derived.criticalDuration ? `Critical: ${derived.criticalDuration} mo` : null,
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
            {derived.savingPhaseDuration !== null && derived.savingPhaseDuration > 0 && (
              <span className="phase-block-duration">{derived.savingPhaseDuration} months</span>
            )}
          </div>
          <div className="phase-block-details">
            <div>Now → {derived.savingPhaseEnd ? formatDate(derived.savingPhaseEnd) : 'Ongoing'}</div>
            <div className="phase-block-sub">Income covers expenses · Building savings</div>
          </div>
        </div>

        {/* Pre-Debt Sub-Phase */}
        {data.totalDebt > 0 && (
          <div className="phase-block sub-phase">
            <div className="phase-block-header">
              <span className="dot" style={{ background: 'var(--color-warn, #f59e0b)' }} />
              <span className="phase-block-title">Pre-Debt (Saving + Paying Debt)</span>
              {derived.preDebtDuration !== null && derived.preDebtDuration > 0 && (
                <span className="phase-block-duration">{derived.preDebtDuration} months</span>
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
              <span className="dot" style={{ background: 'var(--color-ok, #22c55e)' }} />
              <span className="phase-block-title">Post-Debt (Saving Only)</span>
              {derived.postDebtDuration !== null && derived.postDebtDuration > 0 && (
                <span className="phase-block-duration">{derived.postDebtDuration} months</span>
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
                Surplus: {formatCurrency(result.postDebtMonthlySavings)}/mo · Debt paid off · Full surplus going to savings
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
                {derived.consumptionDuration !== null && derived.consumptionDuration > 0 && (
                  <span className="phase-block-duration">{derived.consumptionDuration} months</span>
                )}
              </div>
              <div className="phase-block-details">
                <div className="phase-block-sub">No income · Living off savings · No debt payments</div>
              </div>
            </div>

            <div className="phase-block sub-phase">
              <div className="phase-block-header">
                <span className="dot" style={{ background: 'var(--color-ok)' }} />
                <span className="phase-block-title">Comfortable</span>
                {derived.comfortableDuration !== null && (
                  <span className="phase-block-duration">{derived.comfortableDuration} months</span>
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
                  {derived.cautionDuration !== null && (
                    <span className="phase-block-duration">{derived.cautionDuration} months</span>
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
                  {derived.criticalDuration !== null && (
                    <span className="phase-block-duration">{derived.criticalDuration} months</span>
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

    </Section>
    </>
  );
}
