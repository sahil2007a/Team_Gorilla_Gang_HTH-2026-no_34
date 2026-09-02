export const mockSensors = {
  status: 'online',
  updatedAt: new Date().toISOString(),
  readings: {
    temperature: { value: 28.4, unit: '°C', status: 'normal', min: 15, max: 45 },
    humidity: { value: 64, unit: '%', status: 'normal', min: 30, max: 95 },
    soilMoisture: { value: 42, unit: '%', status: 'low', min: 20, max: 80 },
    light: { value: 780, unit: 'lux', status: 'normal', min: 0, max: 2000 },
  },
};

// Generate 24-hour history for a sensor
function generateHistory(base, variance, points = 24) {
  const now = new Date();
  return Array.from({ length: points }, (_, i) => {
    const time = new Date(now.getTime() - (points - 1 - i) * 60 * 60 * 1000);
    const noise = (Math.random() - 0.5) * variance * 2;
    return {
      time: time.toISOString(),
      label: `${time.getHours()}:00`,
      value: parseFloat((base + noise).toFixed(1)),
    };
  });
}

export const mockSensorHistory = {
  soilMoisture: generateHistory(45, 8),
  temperature: generateHistory(28, 3),
  humidity: generateHistory(62, 6),
};
