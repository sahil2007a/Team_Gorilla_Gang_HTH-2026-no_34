import { useState, useEffect, useCallback, useRef } from 'react';
import { farmService } from '../services/farmService';

export const useSensors = (farmId = 'farm_001', autoRefreshMs = 30000) => {
  const [sensors, setSensors] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  const fetchSensors = useCallback(async () => {
    try {
      const [sensorsRes, historyRes] = await Promise.all([
        farmService.getSensors(farmId),
        farmService.getSensorHistory(farmId),
      ]);
      setSensors(sensorsRes.data);
      setHistory(historyRes.data);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Sensor fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    fetchSensors();
    if (autoRefreshMs > 0) {
      intervalRef.current = setInterval(fetchSensors, autoRefreshMs);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchSensors, autoRefreshMs]);

  return { sensors, history, loading, lastUpdated, refresh: fetchSensors };
};
