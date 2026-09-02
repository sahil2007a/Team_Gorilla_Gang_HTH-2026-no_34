import { mockApiCall } from './api';

export const farmService = {
  getFarms: () => mockApiCall([]),
  getFarm: (id) => mockApiCall(null),
  getWeather: (farmId) => mockApiCall({ current: null, forecast: [] }),
  getSensors: (farmId) => mockApiCall([]),
  getSensorHistory: (farmId) => mockApiCall([]),
  getCrop: (farmId) => mockApiCall(null),
  getTasks: (farmId) => mockApiCall([]),
  completeTask: (taskId) => mockApiCall({ success: true }),
  getDiary: (farmId) => mockApiCall([]),
  addDiaryEntry: (farmId, entry) => mockApiCall({ success: true, entry }),
  getExpenses: (farmId) => mockApiCall({ expenses: [], summary: { total: 0, count: 0 }, categories: [] }),
  addExpense: (farmId, expense) => mockApiCall({ success: true, expense }),
  getMarket: (farmId) => mockApiCall({ crop: null, mandis: [], history: [] }),
  getYieldPrediction: (farmId) => mockApiCall(null),
  getHarvestPlan: (farmId) => mockApiCall(null),
  getLogistics: (farmId) => mockApiCall({
    blocks: [
      { id: 'b1', name: 'Cotton Field A', crop: 'Cotton', readiness: 85, estHarvest: '22 Oct', health: 'Optimal', acreage: 4.5, estYield: '28 Quintals' },
      { id: 'b2', name: 'Soybean Block 2', crop: 'Soybean', readiness: 92, estHarvest: '28 Oct', health: 'Ready to Harvest', acreage: 3.0, estYield: '22 Quintals' },
      { id: 'b3', name: 'Chilli South Plot', crop: 'Chilli', readiness: 68, estHarvest: '10 Nov', health: 'Flowering', acreage: 1.5, estYield: '14 Quintals' },
    ],
    resources: {
      laborAssigned: 8,
      laborNeeded: 12,
      durationDays: 4,
      requiredStorageTonnes: 18,
      allocatedStorageTonnes: 25,
    },
    vehicles: [
      { id: 'v1', type: 'Mahindra 575 DI Tractor + Trolley', capacity: '4 Tonnes', status: 'Available', driver: 'Suresh Patil (9823412345)', rate: '₹1,200/trip' },
      { id: 'v2', type: 'Tata Ace Mini Truck', capacity: '1.5 Tonnes', status: 'In Transit to APMC', driver: 'Ramesh Kale (9422156789)', rate: '₹800/trip' },
      { id: 'v3', type: 'Eicher 10.90 Heavy Truck', capacity: '10 Tonnes', status: 'Scheduled (Tomorrow 8 AM)', driver: 'Vikas Jadhav (9765432100)', rate: '₹3,500/trip' },
    ],
    warehouses: [
      { id: 'w1', name: 'Wardha APMC Central Warehouse', distance: '12 km', capacityLeft: '140 Tonnes', tempControlled: true, rate: '₹45/quintal/mo' },
      { id: 'w2', name: 'Maharashtra Agro Cold Storage', distance: '18 km', capacityLeft: '85 Tonnes', tempControlled: true, rate: '₹70/quintal/mo' },
      { id: 'w3', name: 'Kisan Cooperative Godown', distance: '6 km', capacityLeft: '210 Tonnes', tempControlled: false, rate: '₹30/quintal/mo' },
    ],
    laborCrew: [
      { id: 'l1', teamName: 'Vidarbha Harvesting Gang', members: 10, leader: 'Kisanrao (9876501234)', specialization: 'Cotton & Chilli Picking', dailyRate: '₹400/person' },
      { id: 'l2', teamName: 'Sai Krushi Labor Group', members: 6, leader: 'Gajanan (9123456780)', specialization: 'Threshing & Bagging', dailyRate: '₹450/person' },
    ],
  }),
};
