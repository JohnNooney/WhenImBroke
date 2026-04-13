import { useState, useRef, memo, useMemo } from 'react';
import { MapPin, Target, AlertTriangle, CheckCircle, Info, Wallet, PiggyBank, TrendingUp } from 'lucide-react';
import type { FinancialData, RunwayResult } from '../types';
import { calculateRunway, exportData, validateAndParseImport, formatCurrency, formatDate } from '../utils/calculations';
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
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const result = useMemo(() => calculateRunway(data), [data]);

  const totalExpenses = data.rent + data.utilities + data.groceries + 
    data.subscriptions + data.transport + data.pocketMoney + data.monthlyDebtRepayment;

  const handleFieldChange = (field: keyof FinancialData) => (value: number) => {
    onChange({ ...data, [field]: value });
  };

  const handleJsonImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const text = await file.text();
      const imported = validateAndParseImport(text);
      onChange(imported);
      setImportError(null);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed.');
    }
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
            <input
              ref={jsonInputRef}
              type="file"
              accept=".json"
              onChange={handleJsonImport}
              style={{ display: 'none' }}
            />
            <div className="import-row">
              <button className="btn" onClick={() => fileInputRef.current?.click()}>
                Upload CSV / bank export
              </button>
              <button className="btn" onClick={() => jsonInputRef.current?.click()}>
                Import saved data
              </button>
              <button className="btn primary" onClick={() => setActiveTab('expenses')}>
                Manual entry
              </button>
            </div>
            {importError && (
              <div style={{ fontSize: '12px', color: 'var(--color-danger)', marginTop: '6px' }}>
                {importError}
              </div>
            )}
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Supports: Monzo, Starling, Lloyds, HSBC, Snoop CSV exports
            </div>
          </Section>

          <Section title="Export your data">
            <div className="import-row">
              <button className="btn" onClick={() => exportData(data)}>
                Download as JSON
              </button>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Save your settings to reimport later
            </div>
          </Section>

          <ProjectionSection result={result} data={data} />
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
          <ProjectionSection result={result} data={data} />
          <ProjectionChart result={result} />
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
      )}
    </div>
  );
}

function Section({ title, children, onInfoClick }: { title: string; children: React.ReactNode; onInfoClick?: () => void }) {
  return (
    <div className="section">
      <div className="section-title">
        {title}
        {onInfoClick && (
          <button 
            onClick={onInfoClick}
            className="info-btn"
            aria-label="How this works"
          >
            <Info size={14} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function InfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>How Survival Projection Works</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        <div className="modal-body">
          <h3>Two-Phase Model</h3>
          <p>The projection assumes two distinct phases:</p>
          
          <h4>Phase 1: Saving Mode</h4>
          <ul>
            <li>You have income covering expenses</li>
            <li>Monthly surplus goes to savings</li>
            <li>Debt is being paid down</li>
            <li>Continues until target reached AND debt paid off</li>
          </ul>
          
          <h4>Phase 2: Consumption Mode</h4>
          <ul>
            <li>No income (living off savings)</li>
            <li>No debt payments (already cleared)</li>
            <li>Savings decrease by monthly expenses</li>
          </ul>
          
          <h3>Phase Colours</h3>
          <div className="guide-phases">
            <div><span className="dot" style={{ background: 'var(--color-ok)' }} /> <strong>Comfortable:</strong> Above your comfortable threshold</div>
            <div><span className="dot" style={{ background: 'var(--color-warn)' }} /> <strong>Caution:</strong> Between caution and comfortable thresholds</div>
            <div><span className="dot" style={{ background: 'var(--color-danger)' }} /> <strong>Critical:</strong> Below caution threshold</div>
          </div>
          <p style={{ marginTop: '0.5rem' }}>Adjust thresholds in "Phase thresholds" section below.</p>
          
          <h3>Key Calculations</h3>
          <table className="calc-table">
            <tbody>
              <tr>
                <td><strong>Monthly Surplus</strong></td>
                <td>Income − All Expenses (inc. debt)</td>
              </tr>
              <tr>
                <td><strong>Months to Target</strong></td>
                <td>(Target − Current Savings) ÷ Surplus</td>
              </tr>
              <tr>
                <td><strong>Months to Debt-Free</strong></td>
                <td>Total Debt ÷ Monthly Repayment</td>
              </tr>
              <tr>
                <td><strong>Recommended Cutoff</strong></td>
                <td>Whichever takes longer (target or debt)</td>
              </tr>
              <tr>
                <td><strong>Target Runway</strong></td>
                <td>Target Savings ÷ Monthly Expenses</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ProjectionSection({ result, data }: { result: RunwayResult; data: FinancialData }) {
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
  const comfortableDuration = result.phases.comfortable.end 
    ? monthsBetween(result.lastSafeDate, result.phases.comfortable.end)
    : null;
  const cautionDuration = monthsBetween(result.phases.caution.start, result.phases.caution.end);
  const criticalDuration = monthsBetween(result.phases.critical.start, result.depletionDate);
  
  // Total runway after switching to consumption
  const totalConsumptionRunway = result.targetRunwayMonths;

  // Duration of consumption phase (lastSafeDate → depletionDate)
  const consumptionDuration = monthsBetween(result.lastSafeDate, result.depletionDate);
  // Comfortable duration during consumption (fallback: all of consumption if no phase transition)
  const consumptionComfortableDuration = comfortableDuration ?? consumptionDuration;

  return (
    <>
    {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
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
        {result.targetReachedDate && data.currentSavings < data.emergencyFundTarget && (
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
              <div className="milestone-sub">Target: {formatCurrency(data.emergencyFundTarget)} · Need: {formatCurrency(data.emergencyFundTarget - data.currentSavings)}</div>
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
              <div className="milestone-sub">Target reached & debt-free · Peak savings: {formatCurrency(data.emergencyFundTarget)}</div>
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
            <div className="phase-block-sub">
              Income covers expenses · Surplus: {formatCurrency(result.monthlySurplus)}/mo · Debt being paid down
            </div>
          </div>
        </div>

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
                <div className="phase-block-sub">{data.comfortableThreshold}+ months runway</div>
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
                  <div className="phase-block-sub">{data.cautionThreshold}-{data.comfortableThreshold} months runway</div>
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
                    {formatDate(result.phases.critical.start)} → {result.depletionDate ? formatDate(result.depletionDate) : 'Ongoing'}
                  </div>
                  <div className="phase-block-sub">Under {data.cautionThreshold} months runway · Action needed</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Summary Stats */}
      <div className="projection-summary">
        <div className="summary-stat">
          <div className="summary-label">Total runway from target</div>
          <div className="summary-value">{totalConsumptionRunway} months</div>
        </div>
        <div className="summary-stat">
          <div className="summary-label">Monthly burn rate</div>
          <div className="summary-value">{formatCurrency(result.monthlyExpenses - (result.monthlySurplus > 0 ? 0 : Math.abs(result.monthlySurplus)))}</div>
        </div>
        <div className="summary-stat">
          <div className="summary-label">Current runway</div>
          <div className="summary-value">{result.runwayMonths} months</div>
        </div>
      </div>

    </Section>
    </>
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
