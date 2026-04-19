import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { FinancialData, RunwayResult, DerivedMetrics } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatting';
import { Section } from '../ui';
import { ProjectionSection, ProjectionChart } from '../projection';
import { ScenariosSection } from '../scenarios';

interface ProjectionTabProps {
  data: FinancialData;
  result: RunwayResult;
  derived: DerivedMetrics;
  onChange: (data: FinancialData) => void;
}

export function ProjectionTab({ data, result, derived, onChange }: ProjectionTabProps) {
  const [showThresholds, setShowThresholds] = useState(false);

  const depletionColor = result.depletionDate
    ? result.runwayMonths > data.cautionThreshold
      ? 'var(--color-ok)'
      : result.runwayMonths > data.criticalThreshold
        ? 'var(--color-warn)'
        : 'var(--color-danger)'
    : 'var(--color-ok)';

  return (
    <>
      {/* Hero summary */}
      <div className="projection-hero">
        <div className="projection-hero-label">
          {result.depletionDate ? 'Money runs out' : 'Savings outlook'}
        </div>
        <div className="projection-hero-value" style={{ color: depletionColor }}>
          {result.depletionDate
            ? formatDate(result.depletionDate)
            : 'Sustainable'}
        </div>
        <div className="projection-hero-sub">
          {result.depletionDate
            ? `${derived.monthsToDepletion} months from now · Burn rate: ${formatCurrency(result.livingExpenses)}/mo`
            : 'Income covers expenses — savings will not deplete within 20 years'}
        </div>
      </div>

      <ProjectionSection result={result} data={data} derived={derived} />
      <ProjectionChart result={result} data={data} />
      <ScenariosSection data={data} onChange={onChange} />

      {/* Phase thresholds — collapsible advanced section */}
      <Section title="Settings">
        <button
          className="accordion-toggle"
          onClick={() => setShowThresholds(v => !v)}
        >
          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Phase thresholds — define when each warning level starts
          </span>
          <ChevronDown size={16} className={`chevron ${showThresholds ? 'open' : ''}`} />
        </button>
        {showThresholds && (
          <div style={{ marginTop: '12px' }}>
            <div className="row">
              <div className="field">
                <label style={{ color: 'var(--color-ok)' }}>Comfortable (months)</label>
                <input
                  type="number"
                  value={data.comfortableThreshold}
                  onChange={e => onChange({ ...data, comfortableThreshold: Number(e.target.value) || 12 })}
                  min={1}
                />
              </div>
              <div className="field">
                <label style={{ color: 'var(--color-warn)' }}>Caution (months)</label>
                <input
                  type="number"
                  value={data.cautionThreshold}
                  onChange={e => onChange({ ...data, cautionThreshold: Number(e.target.value) || 6 })}
                  min={1}
                />
              </div>
              <div className="field">
                <label style={{ color: 'var(--color-danger)' }}>Critical (months)</label>
                <input
                  type="number"
                  value={data.criticalThreshold}
                  onChange={e => onChange({ ...data, criticalThreshold: Number(e.target.value) || 3 })}
                  min={1}
                />
              </div>
            </div>
          </div>
        )}
      </Section>
    </>
  );
}
