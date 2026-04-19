import type { FinancialData, RunwayResult, DerivedMetrics } from '../../types';
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
  return (
    <>
      <ProjectionSection result={result} data={data} derived={derived} />
      <ProjectionChart result={result} data={data} />
      <ScenariosSection data={data} onChange={onChange} />
      <Section title="Phase thresholds">
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
          Set how many months of runway define each phase
        </p>
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
      </Section>
    </>
  );
}
