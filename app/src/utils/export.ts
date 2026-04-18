import type { FinancialData } from '../types';

const EXPORT_VERSION = 1;

const REQUIRED_KEYS: (keyof FinancialData)[] = [
  'currentSavings', 'monthlyIncome', 'monthlySavingsContribution', 'savingsTarget',
  'rent', 'utilities', 'groceries', 'subscriptions', 'transport', 'pocketMoney',
  'totalDebt', 'monthlyDebtRepayment',
  'comfortableThreshold', 'cautionThreshold', 'criticalThreshold',
];

export function exportData(data: FinancialData): void {
  const payload = { version: EXPORT_VERSION, exportedAt: new Date().toISOString(), data };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `whenimbroke-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function validateAndParseImport(json: string): FinancialData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Invalid JSON file.');
  }

  const obj = parsed as Record<string, unknown>;
  const candidate = (obj.data ?? obj) as Record<string, unknown>;

  for (const key of REQUIRED_KEYS) {
    if (typeof candidate[key] !== 'number') {
      throw new Error(`Missing or invalid field: ${key}`);
    }
  }

  return candidate as unknown as FinancialData;
}
