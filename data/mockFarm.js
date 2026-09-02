export const mockFarmer = {
  id: 'farmer_001',
  name: 'Rajesh Deshmukh',
  mobile: '+91 98765 43210',
  location: 'Nagpur, Maharashtra',
  language: 'en',
  avatar: null,
  joinedDate: '2024-03-15',
};

export const mockFarm = {
  id: 'farm_001',
  name: 'My Farm',
  farmerId: 'farmer_001',
  area: 5,
  areaUnit: 'Acres',
  cropName: 'Soybean',
  soilType: 'Black Soil',
  waterAvailability: 'Medium',
  location: {
    village: 'Khapri',
    tehsil: 'Nagpur',
    district: 'Nagpur',
    state: 'Maharashtra',
    lat: 21.1458,
    lng: 79.0882,
  },
  healthScore: 82,
  healthLabel: 'Good',
  growthPercent: 88,
  waterPercent: 72,
  diseaseRisk: 'Low',
  nearbyMarket: 'Nagpur Mandi',
  waterSource: {
    type: 'Well',
    distanceMeters: 350,
  },
  storageDistanceKm: 1.8,
  mandiDistanceKm: 12.4,
};

export const mockFarms = [mockFarm];
