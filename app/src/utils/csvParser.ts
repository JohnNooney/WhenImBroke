import type { Transaction, BankFormat, SnoopTransaction } from '../types';

export function detectBankFormat(headers: string[]): BankFormat {
  const headerStr = headers.join(',').toLowerCase();
  
  if (headerStr.includes('transaction id') && headerStr.includes('emoji')) {
    return 'monzo';
  }
  if (headerStr.includes('counter party') || headerStr.includes('reference')) {
    return 'starling';
  }
  if (headerStr.includes('transaction description') && headerStr.includes('debit amount')) {
    return 'lloyds';
  }
  if (headerStr.includes('transaction date') && headerStr.includes('transaction type')) {
    return 'hsbc';
  }
  if (headerStr.includes('merchant name') && headerStr.includes('account provider')) {
    return 'snoop';
  }
  
  return 'unknown';
}

export function parseCSV(content: string): Transaction[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const format = detectBankFormat(headers);
  
  const transactions: Transaction[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 2) continue;
    
    const transaction = parseTransaction(headers, values, format);
    if (transaction) transactions.push(transaction);
  }
  
  return transactions;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  
  return values;
}

function parseTransaction(
  headers: string[],
  values: string[],
  format: BankFormat
): Transaction | null {
  const getValue = (possibleNames: string[]): string => {
    for (const name of possibleNames) {
      const idx = headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
      if (idx !== -1 && values[idx]) return values[idx];
    }
    return '';
  };
  
  let date = '';
  let description = '';
  let amount = 0;
  
  switch (format) {
    case 'monzo':
      date = getValue(['date']);
      description = getValue(['name', 'description']);
      amount = parseFloat(getValue(['amount'])) || 0;
      break;
      
    case 'starling':
      date = getValue(['date']);
      description = getValue(['counter party', 'reference']);
      amount = parseFloat(getValue(['amount'])) || 0;
      break;
      
    case 'lloyds':
      date = getValue(['transaction date']);
      description = getValue(['transaction description']);
      const debit = parseFloat(getValue(['debit amount'])) || 0;
      const credit = parseFloat(getValue(['credit amount'])) || 0;
      amount = credit - debit;
      break;
      
    case 'hsbc':
      date = getValue(['transaction date']);
      description = getValue(['transaction description']);
      amount = parseFloat(getValue(['amount'])) || 0;
      break;
      
    case 'snoop':
      date = getValue(['date']);
      description = getValue(['description', 'merchant name']);
      amount = parseFloat(getValue(['amount'])) || 0;
      break;
      
    default:
      // Generic fallback
      date = values[0] || '';
      description = values[1] || '';
      amount = parseFloat(values[2]) || 0;
  }
  
  if (!date || !description) return null;
  
  return {
    date,
    description,
    amount,
    category: categorizeTransaction(description, amount),
  };
}

function categorizeTransaction(description: string, amount: number): string {
  const desc = description.toLowerCase();
  
  // Only categorize expenses (negative amounts)
  if (amount >= 0) return 'income';
  
  // Rent/Mortgage
  if (desc.includes('rent') || desc.includes('mortgage') || desc.includes('landlord')) {
    return 'rent';
  }
  
  // Utilities
  if (desc.includes('electric') || desc.includes('gas') || desc.includes('water') ||
      desc.includes('council tax') || desc.includes('broadband') || desc.includes('internet') ||
      desc.includes('phone') || desc.includes('mobile')) {
    return 'utilities';
  }
  
  // Groceries
  if (desc.includes('tesco') || desc.includes('sainsbury') || desc.includes('asda') ||
      desc.includes('morrisons') || desc.includes('aldi') || desc.includes('lidl') ||
      desc.includes('waitrose') || desc.includes('co-op') || desc.includes('grocery')) {
    return 'groceries';
  }
  
  // Subscriptions
  if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('amazon prime') ||
      desc.includes('disney') || desc.includes('apple') || desc.includes('subscription') ||
      desc.includes('gym') || desc.includes('membership')) {
    return 'subscriptions';
  }
  
  // Transport
  if (desc.includes('tfl') || desc.includes('uber') || desc.includes('train') ||
      desc.includes('bus') || desc.includes('petrol') || desc.includes('fuel') ||
      desc.includes('parking') || desc.includes('car')) {
    return 'transport';
  }
  
  return 'pocketMoney';
}

export function parseSnoopCSV(content: string): SnoopTransaction[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const transactions: SnoopTransaction[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 4) continue;
    
    const getValue = (name: string): string => {
      const idx = headers.findIndex(h => h.toLowerCase() === name.toLowerCase());
      return idx !== -1 ? values[idx] || '' : '';
    };
    
    const date = getValue('date');
    const description = getValue('description') || getValue('merchant name');
    const amount = parseFloat(getValue('amount')) || 0;
    
    if (!date) continue;
    
    const snoopCategory = getValue('category');
    
    transactions.push({
      date,
      description,
      amount,
      category: mapSnoopCategory(snoopCategory, amount),
      merchantName: getValue('merchant name'),
      snoopCategory,
      notes: getValue('notes'),
      accountProvider: getValue('account provider'),
      accountName: getValue('account name'),
      status: getValue('status'),
      subType: getValue('sub type'),
    });
  }
  
  return transactions;
}

function mapSnoopCategory(snoopCategory: string, amount: number): string {
  if (amount > 0) return 'income';
  
  const cat = snoopCategory.toLowerCase();
  
  if (cat === 'income' || cat === 'internal transfers') return 'income';
  if (cat === 'groceries') return 'groceries';
  if (cat === 'transport' || cat === 'travel') return 'transport';
  if (cat === 'entertainment' || cat === 'learning') return 'subscriptions';
  if (cat === 'eating out') return 'pocketMoney';
  if (cat === 'finances' || cat === 'interest') return 'utilities';
  if (cat === 'health & beauty') return 'pocketMoney';
  if (cat === 'home & family' || cat === 'cats') return 'pocketMoney';
  if (cat === 'shopping') return 'pocketMoney';
  if (cat === 'charity') return 'pocketMoney';
  if (cat === 'cash') return 'pocketMoney';
  
  return 'pocketMoney';
}

export function aggregateTransactions(transactions: Transaction[]): {
  rent: number;
  utilities: number;
  groceries: number;
  subscriptions: number;
  transport: number;
  pocketMoney: number;
  income: number;
} {
  const totals = {
    rent: 0,
    utilities: 0,
    groceries: 0,
    subscriptions: 0,
    transport: 0,
    pocketMoney: 0,
    income: 0,
  };
  
  for (const t of transactions) {
    const category = t.category as keyof typeof totals;
    if (category in totals) {
      totals[category] += Math.abs(t.amount);
    }
  }
  
  // Calculate monthly averages (assume 3 months of data)
  const months = 3;
  return {
    rent: Math.round(totals.rent / months),
    utilities: Math.round(totals.utilities / months),
    groceries: Math.round(totals.groceries / months),
    subscriptions: Math.round(totals.subscriptions / months),
    transport: Math.round(totals.transport / months),
    pocketMoney: Math.round(totals.pocketMoney / months),
    income: Math.round(totals.income / months),
  };
}
