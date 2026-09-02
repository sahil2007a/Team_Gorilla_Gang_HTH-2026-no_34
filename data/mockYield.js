export const mockYieldPrediction = {
  expectedYieldPerAcre: 18.4,
  expectedYieldUnit: 'Quintals / Acre',
  totalExpectedProduction: 92,
  totalUnit: 'Quintals',
  riskLevel: 'Medium',
  predictionConfidence: 87,
  factors: [
    { label: 'Rainfall', status: 'good', score: 82 },
    { label: 'Soil Quality', status: 'good', score: 78 },
    { label: 'Irrigation', status: 'medium', score: 62 },
    { label: 'Disease Risk', status: 'low', score: 88 },
    { label: 'Temperature', status: 'good', score: 75 },
    { label: 'Fertilization', status: 'good', score: 80 },
  ],
  monthlyTrend: [
    { month: 'Jun', value: 0 },
    { month: 'Jul', value: 12 },
    { month: 'Aug', value: 28 },
    { month: 'Sep', value: 50 },
    { month: 'Oct', value: 74 },
    { month: 'Nov', value: 92 },
  ],
};

export const mockHarvest = {
  estimatedHarvestDate: '15 November 2026',
  harvestReadiness: 76,
  requiredLabor: 12,
  estimatedDurationDays: 3,
  storageRequirementTonnes: 18,
  machinery: ['Tractor', 'Harvester', 'Thresher'],
  costEstimate: {
    labor: 14400,
    machinery: 8500,
    transport: 3250,
    total: 26150,
  },
};

export const mockLogistics = {
  waterSourceDistance: '350 m',
  storageDistance: '1.8 km',
  mandiDistance: '12.4 km',
  transportationCost: 3250,
  fuelRequirementLitres: 24,
  recommendedMachinery: ['Tractor', 'Harvester'],
  laborRequirements: [
    { stage: 'Sowing', workers: 6 },
    { stage: 'Maintenance', workers: 2 },
    { stage: 'Harvest', workers: 12 },
  ],
};
