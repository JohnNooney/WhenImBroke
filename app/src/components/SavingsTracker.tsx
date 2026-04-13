import { useState, useRef, memo, useMemo } from 'react';
import type { FinancialData, RunwayResult } from '../types';
import { calculateRunway, formatCurrency, formatDate } from '../utils/calculations';
import { parseCSV, parseSnoopCSV, aggregateTransactions, filterLast30Days, detectBankFormat } from '../utils/csvParser';

interface Props {
  data: FinancialData;
  onChange: (data: FinancialData) => void;
}

type Tab = 'overview' | 'expenses' | 'income' | 'debts' | 'projection';

interface InputFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

const InputField = memo(function InputField({ label, value, onChange }: InputFieldProps) {
  return (
    <div className="field">
      <label>{label}</label>
      <div style={{ position: 'relative' }}>
        <span style={{ 
          position: 'absolute', 
          left: '10px', 
          top: '50%', 
          transform: 'translateY(-50%)',
          color: 'var(--color-text-secondary)',
          pointerEvents: 'none'
        }}>£</span>
        <input
          type="number"
          value={value || ''}
          onChange={(e) => {
            const num = parseFloat(e.target.value) || 0;
            onChange(num);
          }}
          style={{ paddingLeft: '24px' }}
        />
      </div>
    </div>
  );
});

export function SavingsTracker({ data, onChange }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const result = useMemo(() => calculateRunway(data), [data]);

  const totalExpenses = data.rent + data.utilities + data.groceries + 
    data.subscriptions + data.transport + data.pocketMoney + data.monthlyDebtRepayment;

  const handleFieldChange = (field: keyof FinancialData) => (value: number) => {
    onChange({ ...data, [field]: value });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const content = await file.text();
    const lines = content.trim().split('\n');
    const headers = lines[0]?.split(',').map(h => h.trim().replace(/"/g, '')) || [];
    const format = detectBankFormat(headers);
    
    const transactions = format === 'snoop' 
      ? parseSnoopCSV(content) 
      : parseCSV(content);
    
    const recentTransactions = filterLast30Days(transactions);
    const aggregated = aggregateTransactions(recentTransactions);

    onChange({
      ...data,
      rent: aggregated.rent || data.rent,
      utilities: aggregated.utilities || data.utilities,
      groceries: aggregated.groceries || data.groceries,
      subscriptions: aggregated.subscriptions || data.subscriptions,
      transport: aggregated.transport || data.transport,
      pocketMoney: aggregated.pocketMoney || data.pocketMoney,
      monthlyIncome: aggregated.income || data.monthlyIncome,
    });
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'income', label: 'Income' },
    { id: 'debts', label: 'Debts' },
    { id: 'projection', label: 'Projection' },
  ];

  const getValueColor = (type: 'ok' | 'warn' | 'danger' | 'neutral') => {
    switch (type) {
      case 'ok': return 'var(--color-ok)';
      case 'warn': return 'var(--color-warn)';
      case 'danger': return 'var(--color-danger)';
      default: return 'var(--color-text-primary)';
    }
  };

  const getSurplusColor = () => {
    if (result.monthlySurplus > 500) return 'ok';
    if (result.monthlySurplus > 0) return 'warn';
    return 'danger';
  };

  return (
    <div className="wrap">
      {/* Tabs */}
      <div className="tab-row">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Metrics Grid */}
      <div className="metric-grid">
        <div className="metric">
          <div className="label">Current savings</div>
          <div className="value" style={{ color: getValueColor('ok') }}>
            {formatCurrency(data.currentSavings)}
          </div>
        </div>
        <div className="metric">
          <div className="label">Monthly surplus</div>
          <div className="value" style={{ color: getValueColor(getSurplusColor()) }}>
            {result.monthlySurplus >= 0 ? '+' : ''}{formatCurrency(result.monthlySurplus)}
          </div>
        </div>
        <div className="metric">
          <div className="label">Total debt</div>
          <div className="value" style={{ color: data.totalDebt > 0 ? getValueColor('danger') : getValueColor('neutral') }}>
            {formatCurrency(data.totalDebt)}
          </div>
        </div>
        <div className="metric">
          <div className="label">Runway</div>
          <div className="value">
            {result.runwayMonths === Infinity ? '∞' : `${result.runwayMonths} mo`}
          </div>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <Section title="Import your data">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <div className="import-row">
              <button className="btn" onClick={() => fileInputRef.current?.click()}>
                Upload CSV / bank export
              </button>
              <button className="btn primary" onClick={() => setActiveTab('expenses')}>
                Manual entry
              </button>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Supports: Monzo, Starling, Lloyds, HSBC, Snoop CSV exports
            </div>
          </Section>

          <ProjectionSection result={result} />
          <ScenariosSection data={data} onChange={onChange} />
        </>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <Section title="Monthly expenses">
          <div className="row">
            <InputField label="Rent / mortgage" value={data.rent} onChange={handleFieldChange('rent')} />
            <InputField label="Utilities & bills" value={data.utilities} onChange={handleFieldChange('utilities')} />
            <InputField label="Groceries" value={data.groceries} onChange={handleFieldChange('groceries')} />
          </div>
          <div className="row">
            <InputField label="Subscriptions" value={data.subscriptions} onChange={handleFieldChange('subscriptions')} />
            <InputField label="Transport" value={data.transport} onChange={handleFieldChange('transport')} />
            <InputField label="Pocket money" value={data.pocketMoney} onChange={handleFieldChange('pocketMoney')} />
          </div>
          <div style={{ textAlign: 'right', fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Total outgoings: <strong style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(totalExpenses)} / mo</strong>
          </div>
        </Section>
      )}

      {/* Income Tab */}
      {activeTab === 'income' && (
        <Section title="Income & savings">
          <div className="row">
            <InputField label="Monthly take-home" value={data.monthlyIncome} onChange={handleFieldChange('monthlyIncome')} />
            <InputField label="Monthly savings contribution" value={data.monthlySavingsContribution} onChange={handleFieldChange('monthlySavingsContribution')} />
            <InputField label="Current savings" value={data.currentSavings} onChange={handleFieldChange('currentSavings')} />
          </div>
          <div className="row">
            <InputField label="Emergency fund target" value={data.emergencyFundTarget} onChange={handleFieldChange('emergencyFundTarget')} />
          </div>
        </Section>
      )}

      {/* Debts Tab */}
      {activeTab === 'debts' && (
        <Section title="Debt overview">
          <div className="row">
            <InputField label="Total outstanding debt" value={data.totalDebt} onChange={handleFieldChange('totalDebt')} />
            <InputField label="Monthly debt repayment" value={data.monthlyDebtRepayment} onChange={handleFieldChange('monthlyDebtRepayment')} />
          </div>
          {data.totalDebt > 0 && data.monthlyDebtRepayment > 0 && (
            <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              At current rate, debt-free in <strong style={{ color: 'var(--color-text-primary)' }}>
                {Math.ceil(data.totalDebt / data.monthlyDebtRepayment)} months
              </strong>
            </div>
          )}
        </Section>
      )}

      {/* Projection Tab */}
      {activeTab === 'projection' && (
        <>
          <ProjectionSection result={result} />
          <ProjectionChart result={result} />
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="section">
      <div className="section-title">{title}</div>
      {children}
    </div>
  );
}

function ProjectionSection({ result }: { result: RunwayResult }) {
  const today = new Date();
  
  const phases = [
    {
      color: 'var(--color-ok)',
      name: 'Comfortable — income covers all expenses',
      date: result.phases.comfortable.end 
        ? `Now → ${formatDate(result.phases.comfortable.end)}`
        : 'Ongoing',
      badge: result.phases.comfortable.end 
        ? { text: `${Math.ceil((result.phases.comfortable.end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30))} mo`, type: 'ok' as const }
        : null,
    },
    {
      color: 'var(--color-warn)',
      name: 'Target reached — switch to savings-only',
      date: result.lastSafeDate ? formatDate(result.lastSafeDate) : 'N/A',
      badge: result.lastSafeDate 
        ? { text: `${result.targetRunwayMonths} mo runway`, type: 'warn' as const } 
        : null,
    },
    {
      color: 'var(--color-warn)',
      name: 'Drawing from savings — covering gap',
      date: result.phases.caution.start && result.phases.caution.end
        ? `${formatDate(result.phases.caution.start)} → ${formatDate(result.phases.caution.end)}`
        : result.phases.caution.start
        ? `From ${formatDate(result.phases.caution.start)}`
        : 'N/A',
      badge: result.phases.caution.start && result.phases.caution.end
        ? { text: `${Math.ceil((result.phases.caution.end.getTime() - result.phases.caution.start.getTime()) / (1000 * 60 * 60 * 24 * 30))} mo`, type: 'warn' as const }
        : null,
    },
    {
      color: 'var(--color-danger)',
      name: 'Savings depleted — critical threshold',
      date: result.depletionDate ? formatDate(result.depletionDate) : 'Never',
      badge: result.depletionDate 
        ? { text: `${result.runwayMonths} mo runway`, type: 'danger' as const }
        : { text: 'sustainable', type: 'ok' as const },
    },
  ];

  return (
    <Section title="Survival projection">
      <div className="timeline">
        <div className="timeline-fill" style={{ width: '100%' }} />
      </div>
      <div className="tl-labels">
        <span>Today · {formatDate(today)}</span>
        <span style={{ color: 'var(--color-ok)' }}>Safe zone</span>
        <span style={{ color: 'var(--color-warn)' }}>Caution</span>
        <span style={{ color: 'var(--color-danger)' }}>
          Critical · {result.depletionDate ? formatDate(result.depletionDate) : '∞'}
        </span>
      </div>

      {phases.map((phase, i) => (
        <div key={i} className="phase-row">
          <div className="dot" style={{ background: phase.color }} />
          <div className="phase-name">{phase.name}</div>
          <div className="phase-date">
            <strong>{phase.date}</strong>
            {phase.badge && (
              <span className={`badge ${phase.badge.type}`}>{phase.badge.text}</span>
            )}
          </div>
        </div>
      ))}
    </Section>
  );
}

function ProjectionChart({ result }: { result: RunwayResult }) {
  const projections = result.projections.slice(0, 24);
  if (projections.length === 0) return null;

  const maxBalance = Math.max(...projections.map(p => p.savingsBalance));

  return (
    <Section title="Savings over time">
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '120px' }}>
        {projections.map((p, i) => {
          const height = maxBalance > 0 ? (p.savingsBalance / maxBalance) * 100 : 0;
          const color = p.phase === 'comfortable' ? 'var(--color-ok)' 
            : p.phase === 'caution' ? 'var(--color-warn)' 
            : p.phase === 'critical' ? 'var(--color-danger)'
            : 'var(--color-border-tertiary)';
          
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${Math.max(height, 2)}%`,
                background: color,
                borderRadius: '2px 2px 0 0',
                minWidth: '8px',
              }}
              title={`${formatDate(p.date)}: ${formatCurrency(p.savingsBalance)}`}
            />
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
        <span>{formatDate(projections[0].date)}</span>
        <span>{formatDate(projections[projections.length - 1].date)}</span>
      </div>
    </Section>
  );
}

function ScenariosSection({ data, onChange }: { data: FinancialData; onChange: (data: FinancialData) => void }) {
  const applyScenario = (modifier: Partial<FinancialData>) => {
    onChange({ ...data, ...modifier });
  };

  return (
    <Section title="What-if scenarios">
      <div className="row" style={{ marginBottom: 0 }}>
        <button 
          className="btn"
          onClick={() => applyScenario({ rent: Math.max(0, data.rent - 200) })}
        >
          Cut expenses £200/mo
        </button>
        <button 
          className="btn"
          onClick={() => applyScenario({ monthlyDebtRepayment: data.monthlyDebtRepayment + 200 })}
        >
          Pay off debt faster
        </button>
        <button 
          className="btn"
          onClick={() => applyScenario({ monthlyIncome: data.monthlyIncome + 500 })}
        >
          Add £500 side income
        </button>
      </div>
    </Section>
  );
}
