import { useRef } from 'react';
import type { FinancialData } from '../../types';
import { exportData, validateAndParseImport } from '../../utils/export';
import { parseCSV, parseSnoopCSV, aggregateTransactions, filterLast30Days, detectBankFormat } from '../../utils/csvParser';
import { Section } from '../ui';

interface DataTabProps {
  data: FinancialData;
  onChange: (data: FinancialData) => void;
  onTabChange: (tab: 'expenses') => void;
  importError: string | null;
  setImportError: (error: string | null) => void;
}

export function DataTab({ data, onChange, onTabChange, importError, setImportError }: DataTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <>
      {/* Import */}
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
          <button className="btn primary" onClick={() => onTabChange('expenses')}>
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

      {/* Export */}
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
    </>
  );
}
