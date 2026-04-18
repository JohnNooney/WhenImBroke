import { useState, useRef, memo, useMemo } from 'react';
import { MapPin, Target, AlertTriangle, Info, Wallet, PiggyBank, TrendingUp, Shield } from 'lucide-react';
import type { FinancialData, RunwayResult, MonthProjection } from '../types';
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

function Tooltip({ text }: { text: string }) {
  return (
    <span className="tooltip-wrap">
      <Info size={11} aria-hidden="true" />
      <span className="tooltip-box" role="tooltip">{text}</span>
    </span>
  );
}

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
    if (result.monthlySavings > 500) return 'ok';
    if (result.monthlySavings > 0) return 'warn';
    return 'danger';
  };

  const nextMilestone = (() => {
    if (result.depletionDate) {
      const moAway = Math.max(0, Math.ceil((result.depletionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44)));
      return { label: 'Breaks', value: formatDate(result.depletionDate), sub: `${moAway} mo away`, color: 'danger' as const, tooltip: 'When savings will run out at current spending trajectory.' };
    }
    if (result.lastSafeDate) {
      const moAway = Math.max(0, Math.ceil((result.lastSafeDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44)));
      return { label: 'Ready', value: formatDate(result.lastSafeDate), sub: moAway > 0 ? `${moAway} mo away` : 'Now', color: 'ok' as const, tooltip: 'Target reached & debt-free — safe to enter consumption mode.' };
    }
    return { label: 'Runway', value: '∞', sub: 'Sustainable', color: 'neutral' as const, tooltip: 'Savings will not deplete within the 20-year projection window.' };
  })();

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

      {/* Primary Stats */}
      <div className="metric-grid">
        <div className="metric">
          <div className="label">Savings <Tooltip text="Your current savings balance. Baseline for all runway and depletion projections." /></div>
          <div className="value" style={{ color: getValueColor('ok') }}>
            {formatCurrency(data.currentSavings)}
          </div>
          {data.currentSavings >= data.savingsTarget && data.savingsTarget > 0 ? (
            <div className="metric-sub" style={{ color: getValueColor('ok') }}>Target met</div>
          ) : result.targetReachedDate ? (
            <div className="metric-sub">→ {formatCurrency(data.savingsTarget)} by {formatDate(result.targetReachedDate)}</div>
          ) : null}
        </div>
        <div className="metric">
          <div className="label">Monthly net <Tooltip text="Income minus all expenses including debt repayments. Positive means you're building savings each month." /></div>
          <div className="value" style={{ color: getValueColor(getSurplusColor()) }}>
            {result.monthlySavings >= 0 ? '+' : ''}{formatCurrency(result.monthlySavings)}
          </div>
          {data.totalDebt > 0 && data.monthlyDebtRepayment > 0 && (() => {
            const afterDebt = data.monthlyIncome - result.livingExpenses - data.monthlySavingsContribution;
            return (
              <div className="metric-sub">
                → <span style={{ color: getValueColor(afterDebt > 500 ? 'ok' : afterDebt > 0 ? 'warn' : 'danger') }}>
                  {afterDebt >= 0 ? '+' : ''}{formatCurrency(afterDebt)}
                </span> after debt-free
              </div>
            );
          })()}
        </div>
        <div className="metric">
          <div className="label">Runway <Tooltip text="Months your current savings would last if income stopped today, spending only on living expenses." /></div>
          <div className="value">
            {result.runwayMonths === Infinity ? '∞' : `${result.runwayMonths} mo`}
          </div>
          {data.savingsTarget > 0 && result.targetRunwayMonths !== result.runwayMonths && (
            <div className="metric-sub">
              → {result.targetRunwayMonths === Infinity ? '∞' : `${result.targetRunwayMonths} mo`} at target
            </div>
          )}
        </div>
        <div className="metric">
          <div className="label">{nextMilestone.label} <Tooltip text={nextMilestone.tooltip} /></div>
          <div className="value" style={{ color: getValueColor(nextMilestone.color) }}>
            {nextMilestone.value}
          </div>
          <div className="metric-sub">{nextMilestone.sub}</div>
        </div>
      </div>

      {/* Supporting Details */}
      <div className="dash-strip">
        <div className="dash-item">
          <span className="dash-label">Income</span>
          <span className="dash-val" style={{ color: getValueColor('ok') }}>{formatCurrency(data.monthlyIncome)}/mo</span>
        </div>
        <div className="dash-sep" />
        <div className="dash-item">
          <span className="dash-label">Expenses</span>
          <span className="dash-val">{formatCurrency(result.monthlyExpenses)}/mo</span>
        </div>
        {data.totalDebt > 0 && (
          <>
            <div className="dash-sep" />
            <div className="dash-item">
              <span className="dash-label">Debt</span>
              <span className="dash-val" style={{ color: getValueColor('danger') }}>{formatCurrency(data.totalDebt)}</span>
            </div>
          </>
        )}
        <div className="dash-sep" />
        <div className="dash-item">
          <span className="dash-label">Burn rate</span>
          <span className="dash-val">{formatCurrency(result.livingExpenses)}/mo</span>
        </div>
        {data.monthlyIncome > 0 && (
          <>
            <div className="dash-sep" />
            <div className="dash-item">
              <span className="dash-label">Savings rate</span>
              <span className="dash-val" style={{ color: getValueColor(getSurplusColor()) }}>
                {Math.round((result.monthlySavings / data.monthlyIncome) * 100)}%
              </span>
            </div>
          </>
        )}
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
            <InputField label="Savings target" value={data.savingsTarget} onChange={handleFieldChange('savingsTarget')} />
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
          <ProjectionChart result={result} data={data} />
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
      <div className="privacy-notice">
        <Shield size={12} style={{ flexShrink: 0 }} />
        <span>All data is stored locally in your browser. Nothing is sent to any server.</span>
      </div>
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

function InfoModal({ onClose, data }: { onClose: () => void; data: FinancialData }) {
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
          
          <h3>Phase Breakdown</h3>
          <p>During Consumption Mode, your savings runway determines which phase you're in. <strong>Thresholds define the runway range</strong> for each phase; actual <strong>time spent</strong> depends on your savings balance.</p>
          <div className="guide-phases">
            <div><span className="dot" style={{ background: 'var(--color-ok)' }} /> <strong>Comfortable:</strong> Runway &gt; {data.comfortableThreshold} months</div>
            <div><span className="dot" style={{ background: 'var(--color-warn)' }} /> <strong>Caution:</strong> Runway {data.criticalThreshold+1}-{data.cautionThreshold} months</div>
            <div><span className="dot" style={{ background: 'var(--color-danger)' }} /> <strong>Critical:</strong> Runway 0-{data.criticalThreshold} months</div>
            <div><span className="dot" style={{ background: 'var(--color-border-tertiary)' }} /> <strong>Depleted:</strong> 0 months runway — savings exhausted</div>
          </div>
          <p style={{ marginTop: '0.5rem' }}>Critical ends the month before depletion. Depleted shows the actual month you run out of money.</p>
          <p>Adjust thresholds in "Phase thresholds" section below.</p>
          
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
                : result.phases.saving.postDebt.start
                  ? formatDate(result.phases.saving.postDebt.start)
                  : result.lastSafeDate
                    ? formatDate(result.lastSafeDate)
                    : 'Ongoing'}
            </div>
            <div className="phase-block-sub">
              Surplus: {formatCurrency(result.monthlySavings)}/mo · Debt being paid down
            </div>
          </div>
        </div>

        {/* Post-Debt Sub-Phase (only if applicable) */}
        {result.phases.saving.postDebt.start && (
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

function ProjectionChart({ result, data }: { result: RunwayResult; data: FinancialData }) {
  const [selected, setSelected] = useState<MonthProjection | null>(null);

  // Show until 2 months past depletion, or 36 months, whichever is less
  const deplIdx = result.projections.findIndex(p => p.phase === 'depleted');
  const displayCount = Math.min(
    deplIdx >= 0 ? deplIdx + 3 : 36,
    result.projections.length,
  );
  const projections = result.projections.slice(0, displayCount);
  if (projections.length === 0) return null;

  const maxBalance = Math.max(...projections.map(p => p.savingsBalance));
  const effectiveMax = Math.max(maxBalance, data.savingsTarget, 1);

  const phaseColor = (phase: MonthProjection['phase']) => {
    if (phase === 'comfortable') return 'var(--color-ok)';
    if (phase === 'caution') return 'var(--color-warn)';
    if (phase === 'critical') return 'var(--color-danger)';
    return 'var(--color-border-secondary)';
  };

  // Find milestone indices within displayed range
  const findMilestoneIdx = (date: Date | null) => {
    if (!date) return -1;
    const idx = projections.findIndex(p => p.date >= date);
    return idx;
  };
  const debtFreeIdx = findMilestoneIdx(result.debtFreeDate);
  const lastSafeIdx = findMilestoneIdx(result.lastSafeDate);
  const shownDeplIdx = deplIdx >= 0 && deplIdx < displayCount ? deplIdx : -1;

  // Don't show debtFree marker if it's the same month as lastSafe
  const showDebtFree = debtFreeIdx >= 0 && debtFreeIdx !== lastSafeIdx;

  const markerLeft = (idx: number) =>
    `${((idx + 0.5) / projections.length) * 100}%`;

  // Savings target line height (% from bottom)
  const targetLinePct = data.savingsTarget > 0
    ? Math.min((data.savingsTarget / effectiveMax) * 100, 99)
    : null;

  return (
    <Section title="Savings over time">
      {/* Y-axis reference */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
        <span>{formatCurrency(effectiveMax)}</span>
        {targetLinePct !== null && (
          <span style={{ color: 'var(--color-ok)' }}>Target {formatCurrency(data.savingsTarget)}</span>
        )}
        <span>£0</span>
      </div>

      {/* Chart area */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '120px', position: 'relative' }}>

        {/* Savings target horizontal line */}
        {targetLinePct !== null && (
          <div style={{
            position: 'absolute', left: 0, right: 0,
            bottom: `${targetLinePct}%`,
            borderTop: '1px dashed var(--color-ok)',
            opacity: 0.45,
            pointerEvents: 'none',
            zIndex: 1,
          }} />
        )}

        {/* Milestone: debt-free */}
        {showDebtFree && (
          <div style={{
            position: 'absolute', top: 0, bottom: 0,
            left: markerLeft(debtFreeIdx),
            borderLeft: '1px dashed var(--color-warn)',
            opacity: 0.7,
            pointerEvents: 'none',
            zIndex: 3,
          }}>
            <span style={{ position: 'absolute', top: 2, left: 4, fontSize: '10px', color: 'var(--color-warn)', whiteSpace: 'nowrap', lineHeight: 1 }}>debt-free</span>
          </div>
        )}

        {/* Milestone: ready (consumption mode) */}
        {lastSafeIdx >= 0 && (
          <div style={{
            position: 'absolute', top: 0, bottom: 0,
            left: markerLeft(lastSafeIdx),
            borderLeft: '1px dashed var(--color-ok)',
            opacity: 0.7,
            pointerEvents: 'none',
            zIndex: 3,
          }}>
            <span style={{ position: 'absolute', top: showDebtFree && Math.abs(lastSafeIdx - debtFreeIdx) < 4 ? 14 : 2, left: 4, fontSize: '10px', color: 'var(--color-ok)', whiteSpace: 'nowrap', lineHeight: 1 }}>ready</span>
          </div>
        )}

        {/* Milestone: depleted */}
        {shownDeplIdx >= 0 && (
          <div style={{
            position: 'absolute', top: 0, bottom: 0,
            left: markerLeft(shownDeplIdx),
            borderLeft: '1px dashed var(--color-danger)',
            opacity: 0.7,
            pointerEvents: 'none',
            zIndex: 3,
          }}>
            <span style={{ position: 'absolute', top: 2, right: 4, left: 'auto', fontSize: '10px', color: 'var(--color-danger)', whiteSpace: 'nowrap', lineHeight: 1 }}>broke</span>
          </div>
        )}

        {/* Bars */}
        {projections.map((p, i) => {
          const height = (p.savingsBalance / effectiveMax) * 100;
          const isSelected = selected?.month === p.month;
          return (
            <div
              key={i}
              onClick={() => setSelected(isSelected ? null : p)}
              style={{
                flex: 1,
                height: `${Math.max(height, 1.5)}%`,
                background: phaseColor(p.phase),
                borderRadius: '2px 2px 0 0',
                minWidth: '4px',
                cursor: 'pointer',
                position: 'relative',
                zIndex: 2,
                outline: isSelected ? '2px solid var(--color-text-primary)' : 'none',
                outlineOffset: '2px',
                opacity: selected && !isSelected ? 0.5 : 1,
                transition: 'opacity 0.1s',
              }}
            />
          );
        })}
      </div>

      {/* X-axis labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
        <span>{formatDate(projections[0].date)}</span>
        <span>{formatDate(projections[projections.length - 1].date)}</span>
      </div>

      {/* Phase legend */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
        {(['comfortable', 'caution', 'critical', 'depleted'] as const).map(ph => (
          projections.some(p => p.phase === ph) && (
            <span key={ph} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '2px', background: phaseColor(ph), display: 'inline-block' }} />
              {ph}
            </span>
          )
        ))}
      </div>

      {/* Selected month detail */}
      {selected && (
        <div style={{
          marginTop: '10px',
          padding: '10px 12px',
          background: 'var(--color-background-secondary)',
          borderRadius: 'var(--border-radius-md)',
          fontSize: '13px',
          border: '0.5px solid var(--color-border-tertiary)',
        }}>
          <div style={{ fontWeight: 600, marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px' }}>
              {formatDate(selected.date)} · Month {selected.month + 1} ·{' '}
              <span style={{ color: selected.mode === 'saving' ? 'var(--color-ok)' : 'var(--color-warn)' }}>
                {selected.mode === 'saving' ? 'Saving' : 'Consumption'}
              </span>
            </span>
            <button
              onClick={() => setSelected(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--color-text-secondary)', lineHeight: 1, padding: 0 }}
            >×</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
            <div>Balance <strong>{formatCurrency(selected.savingsBalance)}</strong></div>
            <div>Phase <strong style={{ color: phaseColor(selected.phase) }}>{selected.phase}</strong></div>
            {selected.income > 0 && <div>Income <span style={{ color: 'var(--color-ok)' }}>+{formatCurrency(selected.income)}</span></div>}
            <div>Expenses <span style={{ color: 'var(--color-danger)' }}>−{formatCurrency(selected.expenses)}</span></div>
            {selected.debtPaid > 0 && <div>Debt paid <span style={{ color: 'var(--color-warn)' }}>−{formatCurrency(selected.debtPaid)}</span></div>}
            {selected.remainingDebt > 0 && <div>Debt left <span style={{ color: 'var(--color-danger)' }}>{formatCurrency(selected.remainingDebt)}</span></div>}
            <div>Net <strong style={{ color: selected.netChange >= 0 ? 'var(--color-ok)' : 'var(--color-danger)' }}>{selected.netChange >= 0 ? '+' : ''}{formatCurrency(selected.netChange)}</strong></div>
          </div>
        </div>
      )}
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
