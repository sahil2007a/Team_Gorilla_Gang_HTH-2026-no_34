export const mockMarketCrop = {
  name: 'Soybean',
  currentPrice: 5240,
  unit: 'Quintal',
  currency: '₹',
  changePercent: 4.2,
  changeDirection: 'up',
  trend: 'Positive',
  bestSellingPeriod: 'October — December',
  location: 'Nagpur Mandi',
};

export const mockNearbyMandis = [
  { id: 'm1', name: 'Nagpur', price: 5240, distance: '12.4 km', trend: 'up' },
  { id: 'm2', name: 'Wardha', price: 5180, distance: '68 km', trend: 'stable' },
  { id: 'm3', name: 'Amravati', price: 5310, distance: '155 km', trend: 'up' },
  { id: 'm4', name: 'Akola', price: 5290, distance: '170 km', trend: 'up' },
];

export const mockPriceHistory = [
  { month: 'Feb', price: 4800 },
  { month: 'Mar', price: 4950 },
  { month: 'Apr', price: 5020 },
  { month: 'May', price: 4890 },
  { month: 'Jun', price: 5100 },
  { month: 'Jul', price: 5030 },
  { month: 'Aug', price: 5240 },
];
