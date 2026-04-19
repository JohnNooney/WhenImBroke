import { useRef } from 'react';
import type { FinancialData } from '../../types';
import { formatCurrency } from '../../utils/formatting';
import { exportData, validateAndParseImport } from '../../utils/export';
import { parseCSV, parseSnoopCSV, aggregateTransactions, filterLast30Days, detectBankFormat } from '../../utils/csvParser';
import { Section, InputField } from '../ui';

interface MyMoneyTabProps {
  data: FinancialData;
  onChange: (data: FinancialData) => void;
  importError: string | null;
  setImportError: (error: string | null) => void;
}

export function MyMoneyTab({ data, onChange, importError, setImportError }: MyMoneyTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

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
    setImportError(null);
  };

  const livingExpenses = data.rent + data.utilities + data.groceries +
    data.subscriptions + data.transport + data.pocketMoney;
  const totalCommitted = livingExpenses + data.monthlyDebtRepayment + data.monthlySavingsContribution;
  const surplus = data.monthlyIncome - totalCommitted;

  // Progress indicator
  const fields = [
    data.monthlyIncome,
    data.currentSavings,
    data.rent,
    data.groceries,
  ];
  const filledCount = fields.filter(v => v > 0).length;
  const progress = Math.round((filledCount / fields.length) * 100);

  return (
    <>
      {/* Progress */}
      {progress < 100 && (
        <div className="progress-banner">
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="progress-label">
            {progress === 0 ? 'Enter your income and expenses to get started' :
             progress < 100 ? `${progress}% complete — fill in the remaining fields for an accurate projection` :
             'All set'}
          </span>
        </div>
      )}

      {/* Quick import */}
      <Section title="Import data">
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
            Upload bank CSV
          </button>
          <button className="btn" onClick={() => jsonInputRef.current?.click()}>
            Import saved data
          </button>
          <button className="btn" onClick={() => exportData(data)}>
            Export as JSON
          </button>
        </div>
        {importError && (
          <div style={{ fontSize: '12px', color: 'var(--color-danger)', marginTop: '6px' }}>
            {importError}
          </div>
        )}
        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
          Supports Monzo, Starling, Lloyds, HSBC, Snoop CSV exports
        </div>
      </Section>

      {/* Income & Savings */}
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

      {/* Expenses */}
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
      </Section>

      {/* Debt */}
      <Section title="Debt">
        <div className="row">
          <InputField label="Total outstanding debt" value={data.totalDebt} onChange={handleFieldChange('totalDebt')} />
          <InputField label="Monthly debt repayment" value={data.monthlyDebtRepayment} onChange={handleFieldChange('monthlyDebtRepayment')} />
        </div>
        {data.totalDebt > 0 && data.monthlyDebtRepayment > 0 && (
          <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Debt-free in <strong style={{ color: 'var(--color-text-primary)' }}>
              {Math.ceil(data.totalDebt / data.monthlyDebtRepayment)} months
            </strong>
          </div>
        )}
      </Section>

      {/* Breakdown */}
      <Section title="Monthly summary">
        <div className="breakdown">
          <div className="breakdown-row">
            <span>Living expenses</span>
            <span>{formatCurrency(livingExpenses)}</span>
          </div>
          {data.monthlySavingsContribution > 0 && (
            <div className="breakdown-row">
              <span>Savings contribution</span>
              <span>{formatCurrency(data.monthlySavingsContribution)}</span>
            </div>
          )}
          {data.monthlyDebtRepayment > 0 && (
            <div className="breakdown-row">
              <span>Debt repayment</span>
              <span>{formatCurrency(data.monthlyDebtRepayment)}</span>
            </div>
          )}
          <div className="breakdown-row breakdown-total">
            <span>Total committed</span>
            <span>{formatCurrency(totalCommitted)}</span>
          </div>
          <div className="breakdown-row" style={{ marginTop: '8px' }}>
            <span>Monthly income</span>
            <span>{formatCurrency(data.monthlyIncome)}</span>
          </div>
          <div className="breakdown-row breakdown-result">
            <span>Surplus</span>
            <span style={{ color: surplus >= 0 ? 'var(--color-ok)' : 'var(--color-danger)' }}>
              {surplus >= 0 ? '+' : ''}{formatCurrency(surplus)}
            </span>
          </div>
          {surplus > 0 && data.monthlySavingsContribution > 0 && (
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
              {formatCurrency(data.monthlySavingsContribution)} contribution + {formatCurrency(surplus)} surplus = <strong style={{ color: 'var(--color-ok)' }}>{formatCurrency(data.monthlySavingsContribution + surplus)}/mo</strong> into savings
            </div>
          )}
          {surplus < 0 && (
            <div style={{ fontSize: '12px', color: 'var(--color-danger)', marginTop: '8px' }}>
              Spending exceeds income — savings will deplete
            </div>
          )}
        </div>
      </Section>
    </>
  );
}
