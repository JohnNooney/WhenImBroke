import { useMemo } from 'react';
import type { FinancialData, RunwayResult, DerivedMetrics } from '../types';
import { deriveMetrics } from '../utils/derived';

export function useDerivedMetrics(data: FinancialData, result: RunwayResult): DerivedMetrics {
  return useMemo(() => deriveMetrics(data, result), [data, result]);
}
