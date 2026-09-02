export const mockExpenseSummary = {
  totalInvestment: 42500,
  expectedRevenue: 78000,
  expectedProfit: 35500,
  profitMargin: 45.5,
  currency: '₹',
};

export const mockExpenseCategories = [
  { id: 'seeds', label: 'Seeds', amount: 8000, color: '#1B7A4B', percent: 18.8 },
  { id: 'fertilizer', label: 'Fertilizer', amount: 12500, color: '#4285F4', percent: 29.4 },
  { id: 'pesticides', label: 'Pesticides', amount: 6000, color: '#E5A52B', percent: 14.1 },
  { id: 'labor', label: 'Labor', amount: 9000, color: '#D9534F', percent: 21.2 },
  { id: 'machinery', label: 'Machinery', amount: 7000, color: '#9AA39D', percent: 16.5 },
  { id: 'transport', label: 'Transportation', amount: 2500, color: '#6B756E', percent: 5.9 },
];

export const mockExpenses = [
  {
    id: 'exp_001',
    category: 'seeds',
    label: 'Seeds',
    description: 'JS 335 Soybean Seeds — 15 kg',
    amount: 8000,
    date: '2026-06-25',
    receipt: null,
  },
  {
    id: 'exp_002',
    category: 'fertilizer',
    label: 'Fertilizer',
    description: 'DAP — 2 bags, Urea — 1 bag',
    amount: 12500,
    date: '2026-07-05',
    receipt: null,
  },
  {
    id: 'exp_003',
    category: 'pesticides',
    label: 'Pesticides',
    description: 'Fungicide spray — 2 litres',
    amount: 6000,
    date: '2026-08-01',
    receipt: null,
  },
  {
    id: 'exp_004',
    category: 'labor',
    label: 'Labor',
    description: 'Weeding — 6 workers × 3 days',
    amount: 9000,
    date: '2026-07-20',
    receipt: null,
  },
  {
    id: 'exp_005',
    category: 'machinery',
    label: 'Machinery',
    description: 'Tractor hire — 4 hours',
    amount: 7000,
    date: '2026-06-28',
    receipt: null,
  },
  {
    id: 'exp_006',
    category: 'transport',
    label: 'Transportation',
    description: 'Input material transport',
    amount: 2500,
    date: '2026-06-26',
    receipt: null,
  },
];
