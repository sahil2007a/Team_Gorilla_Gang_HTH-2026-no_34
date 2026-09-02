/**
 * AgriFlow Supabase Live IoT Telemetry Service
 * Ultra-fast Real-Time Supabase Connector with zero-cache delay & dual direct/backend fallback
 */
import { apiClient } from './api';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY || '';
let lastProxyFailTime = 0;

const getHeaders = () => ({
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
});

function parseSoilValue(rawSoil) {
  if (rawSoil === undefined || rawSoil === null) return null;
  const num = Number(rawSoil);
  if (isNaN(num)) return null;
  if (num <= 100) return Math.round(num);
  // 12-bit ADC mapping (4095 dry in air = 0%, ~1000 in wet soil = 100%)
  const percentage = Math.round(((4095 - num) / 3000) * 100);
  return Math.max(0, Math.min(100, percentage));
}

function parseTempValue(rawTemp) {
  if (rawTemp === undefined || rawTemp === null) return null;
  const num = Number(rawTemp);
  return isNaN(num) ? null : Number(num.toFixed(1));
}

function parseHumValue(rawHum) {
  if (rawHum === undefined || rawHum === null) return null;
  const num = Number(rawHum);
  return isNaN(num) ? null : Number(num.toFixed(1));
}

export const supabaseSensors = {
  /**
   * Fetches the single latest sensor reading from Supabase table 'sensor_readings'.
   */
  getLatestReading: async () => {
    // 1. Primary: Direct Supabase REST fetch with zero-cache timestamp
    try {
      const url = `${SUPABASE_URL}/rest/v1/sensor_readings?select=*&order=id.desc&limit=1&_t=${Date.now()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (response.ok) {
        const rows = await response.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const row = rows[0];
          const rawTemp = row.temperature ?? row.temp ?? row.temperature_c ?? row.t;
          const rawHum = row.humidity ?? row.hum ?? row.humidity_pct ?? row.h;
          const rawSoil = row.soil_moisture ?? row.soil ?? row.moisture ?? row.sm;

          return {
            success: true,
            hasData: true,
            tableUsed: 'sensor_readings',
            id: row.id,
            deviceId: row.device_id || row.sensor_id || 'ESP32-SOIL-001',
            soilMoisture: parseSoilValue(rawSoil),
            temperature: parseTempValue(rawTemp),
            humidity: parseHumValue(rawHum),
            createdAt: row.created_at || row.timestamp || new Date().toISOString(),
            raw: row,
          };
        }
      }
    } catch (directErr) {
      console.log('[Supabase Direct Sensor fetch note]:', directErr.message);
    }

    // 2. Secondary: Backend proxy fallback (with 30s cooldown if down)
    if (Date.now() - lastProxyFailTime > 30000) {
      try {
        const backendRes = await apiClient.get('/sensors/live', { timeout: 1500 });
        if (backendRes && backendRes.success && backendRes.hasData) {
          return {
            success: true,
            hasData: true,
            tableUsed: 'sensor_readings (proxy)',
            id: backendRes.id,
            deviceId: backendRes.deviceId || 'ESP32-SOIL-001',
            soilMoisture: backendRes.soilMoisture,
            temperature: backendRes.temperature,
            humidity: backendRes.humidity,
            createdAt: backendRes.createdAt,
            raw: backendRes.raw,
          };
        }
      } catch (backendErr) {
        lastProxyFailTime = Date.now();
      }
    }

    return {
      success: true,
      hasData: false,
      tableUsed: 'sensor_readings',
      deviceId: 'ESP32-SOIL-001',
      soilMoisture: null,
      temperature: null,
      humidity: null,
      createdAt: null,
      raw: null,
    };
  },

  /**
   * Fetches up to N most recent sensor readings (FIFO history) from Supabase.
   */
  getRecentReadings: async (limit = 5) => {
    // 1. Primary: Direct Supabase REST
    try {
      const url = `${SUPABASE_URL}/rest/v1/sensor_readings?select=*&order=id.desc&limit=${limit}&_t=${Date.now()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (response.ok) {
        const rows = await response.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const mapped = rows.map((row, index) => {
            const rawTemp = row.temperature ?? row.temp ?? row.temperature_c ?? row.t;
            const rawHum = row.humidity ?? row.hum ?? row.humidity_pct ?? row.h;
            const rawSoil = row.soil_moisture ?? row.soil ?? row.moisture ?? row.sm;

            return {
              id: row.id || `entry_${index}_${Date.now()}`,
              soilMoisture: parseSoilValue(rawSoil),
              temperature: parseTempValue(rawTemp),
              humidity: parseHumValue(rawHum),
              deviceId: row.device_id || row.sensor_id || 'ESP32-SOIL-001',
              createdAt: row.created_at || row.timestamp || new Date().toISOString(),
              raw: row,
            };
          });

          return {
            success: true,
            hasData: true,
            tableUsed: 'sensor_readings',
            entries: mapped,
          };
        }
      }
    } catch (directErr) {
      console.log('[Supabase Direct History note]:', directErr.message);
    }

    // 2. Secondary: Backend proxy fallback
    try {
      const backendRes = await apiClient.get(`/sensors/history?limit=${limit}`);
      if (backendRes && backendRes.success && backendRes.entries) {
        return {
          success: true,
          hasData: true,
          tableUsed: 'sensor_readings (proxy)',
          entries: backendRes.entries,
        };
      }
    } catch (backendErr) {
      console.log('[Sensors Backend History proxy note]:', backendErr.message);
    }

    return {
      success: true,
      hasData: false,
      tableUsed: 'sensor_readings',
      entries: [],
    };
  },
};
