import { useState, useRef } from 'react';
import type { FinancialData } from '../types';
import { parseCSV, aggregateTransactions } from '../utils/csvParser';
import { Upload, PoundSterling, Home, Zap, ShoppingCart, CreditCard, Car, Wallet, Landmark, FileText } from 'lucide-react';

interface Props {
  data: FinancialData;
  onChange: (data: FinancialData) => void;
}

export function InputForm({ data, onChange }: Props) {
  const [activeTab, setActiveTab] = useState<'manual' | 'import'>('manual');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof FinancialData, value: string) => {
    const numValue = parseFloat(value) || 0;
    onChange({ ...data, [field]: numValue });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const content = await file.text();
    const transactions = parseCSV(content);
    const aggregated = aggregateTransactions(transactions);

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

  const InputField = ({
    label,
    field,
    icon: Icon,
  }: {
    label: string;
    field: keyof FinancialData;
    icon: typeof PoundSterling;
  }) => (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">£</span>
        <input
          type="number"
          value={data[field] || ''}
          onChange={(e) => handleChange(field, e.target.value)}
          className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          placeholder="0"
        />
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
            activeTab === 'manual'
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Manual Entry
        </button>
        <button
          onClick={() => setActiveTab('import')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
            activeTab === 'import'
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
        >
          <Upload className="w-4 h-4 inline mr-2" />
          Import CSV
        </button>
      </div>

      {activeTab === 'import' && (
        <div className="mb-6 p-6 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Upload className="w-12 h-12 mx-auto mb-3 text-slate-400" />
          <p className="text-slate-600 dark:text-slate-400 mb-2">
            Drop your bank CSV here or click to upload
          </p>
          <p className="text-sm text-slate-500 mb-4">
            Supports Monzo, Starling, Lloyds, HSBC
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Select File
          </button>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-emerald-500" />
            Savings & Income
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Current Savings" field="currentSavings" icon={PoundSterling} />
            <InputField label="Monthly Income" field="monthlyIncome" icon={PoundSterling} />
            <InputField label="Monthly Savings" field="monthlySavingsContribution" icon={PoundSterling} />
            <InputField label="Emergency Fund Target" field="emergencyFundTarget" icon={PoundSterling} />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-amber-500" />
            Monthly Expenses
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Rent / Mortgage" field="rent" icon={Home} />
            <InputField label="Utilities & Bills" field="utilities" icon={Zap} />
            <InputField label="Groceries" field="groceries" icon={ShoppingCart} />
            <InputField label="Subscriptions" field="subscriptions" icon={CreditCard} />
            <InputField label="Transport" field="transport" icon={Car} />
            <InputField label="Pocket Money" field="pocketMoney" icon={Wallet} />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-red-500" />
            Debt
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Total Outstanding Debt" field="totalDebt" icon={CreditCard} />
            <InputField label="Monthly Debt Repayment" field="monthlyDebtRepayment" icon={PoundSterling} />
          </div>
        </div>
      </div>
    </div>
  );
}
