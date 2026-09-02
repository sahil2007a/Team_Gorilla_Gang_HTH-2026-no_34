export const mockWeather = {
  temperature: 28,
  feelsLike: 31,
  condition: 'Partly Cloudy',
  conditionCode: 'partly_cloudy',
  humidity: 64,
  rainProbability: 20,
  windSpeed: 12,
  windUnit: 'km/h',
  uvIndex: 5,
  location: 'Nagpur, MH',
  updatedAt: new Date().toISOString(),
};

export const mockForecast = [
  { day: 'Today', high: 28, low: 22, condition: 'Partly Cloudy', rain: 20 },
  { day: 'Tue', high: 30, low: 23, condition: 'Sunny', rain: 5 },
  { day: 'Wed', high: 27, low: 21, condition: 'Rainy', rain: 70 },
  { day: 'Thu', high: 25, low: 20, condition: 'Cloudy', rain: 40 },
  { day: 'Fri', high: 29, low: 22, condition: 'Sunny', rain: 10 },
];
