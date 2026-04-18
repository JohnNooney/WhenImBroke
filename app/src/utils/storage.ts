import type { FinancialData } from '../types';

const STORAGE_KEY = 'whenimbroke-data';
const STORAGE_VERSION = 1;

export function loadFromStorage(): FinancialData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { version: number; data: FinancialData };
    if (parsed.version !== STORAGE_VERSION) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function saveToStorage(data: FinancialData): void {
  try {
    const payload = { version: STORAGE_VERSION, data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota errors
  }
}
