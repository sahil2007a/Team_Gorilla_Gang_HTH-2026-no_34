export const mockCrop = {
  id: 'crop_001',
  farmId: 'farm_001',
  name: 'Soybean',
  variety: 'JS 335',
  sowingDate: '2026-08-16', // User requested today's date
  expectedHarvestDate: '2026-11-24',
  durationDays: 100,
  currentDay: 5,
  currentStage: 'Sowing',
  currentStageIndex: 1,
  growthPerformance: 95,

  stages: [
    { 
      id: 0, name: 'Land Preparation', status: 'completed', startDay: -10, endDay: 0,
      imageUri: 'https://images.unsplash.com/photo-1590682680695-43b964a3ae17?w=400&q=80',
      healthStatus: 'Soil is well tilled and ready for seeds.',
      precautions: 'Ensure proper soil moisture before sowing.'
    },
    { 
      id: 1, name: 'Sowing', status: 'current', startDay: 0, endDay: 7,
      imageUri: null,
      healthStatus: null,
      precautions: null
    },
    { 
      id: 2, name: 'Germination', status: 'upcoming', startDay: 7, endDay: 15,
      imageUri: null, healthStatus: null, precautions: null
    },
    { 
      id: 3, name: 'Vegetative Growth', status: 'upcoming', startDay: 15, endDay: 40,
      imageUri: null, healthStatus: null, precautions: null
    },
    { 
      id: 4, name: 'Flowering', status: 'upcoming', startDay: 40, endDay: 60,
      imageUri: null, healthStatus: null, precautions: null
    },
    { 
      id: 5, name: 'Pod Formation', status: 'upcoming', startDay: 60, endDay: 80,
      imageUri: null, healthStatus: null, precautions: null
    },
    { 
      id: 6, name: 'Maturation', status: 'upcoming', startDay: 80, endDay: 95,
      imageUri: null, healthStatus: null, precautions: null
    },
    { 
      id: 7, name: 'Harvest', status: 'upcoming', startDay: 95, endDay: 100,
      imageUri: null, healthStatus: null, precautions: null
    },
  ],

  care: {
    lastIrrigation: '2026-08-15',
    lastFertilizer: 'N/A',
    lastPesticide: 'N/A',
    nextIrrigation: '2026-08-18',
    nextFertilizer: '2026-08-30',
  },
};
