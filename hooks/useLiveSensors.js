import { useState, useEffect, useCallback, useRef } from 'react';
import { supabaseSensors } from '../services/supabaseSensors';

export const useLiveSensors = (pollIntervalMs = 10000, includeHistory = false) => {
  const [sensorData, setSensorData] = useState(null);
  const [recentEntries, setRecentEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const timerRef = useRef(null);
  const isMountedRef = useRef(true);

  const fetchLive = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      if (includeHistory) {
        const [latestRes, historyRes] = await Promise.all([
          supabaseSensors.getLatestReading(),
          supabaseSensors.getRecentReadings(5),
        ]);
        if (isMountedRef.current) {
          setSensorData(latestRes);
          if (historyRes && historyRes.entries && historyRes.entries.length > 0) {
            setRecentEntries(historyRes.entries);
          }
        }
      } else {
        const latestRes = await supabaseSensors.getLatestReading();
        if (isMountedRef.current) {
          setSensorData(latestRes);
        }
      }
    } catch (e) {
      // Background poll error silently ignored to avoid console spam
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        if (isManual) setRefreshing(false);
      }
    }
  }, [includeHistory]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchLive();
    timerRef.current = setInterval(() => {
      fetchLive();
    }, pollIntervalMs);

    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchLive, pollIntervalMs]);

  const refresh = useCallback(() => {
    return fetchLive(true);
  }, [fetchLive]);

  return {
    sensorData,
    recentEntries,
    hasData: sensorData?.hasData || false,
    isLive: sensorData?.hasData || false,
    soilMoisture: sensorData?.soilMoisture,
    temperature: sensorData?.temperature,
    humidity: sensorData?.humidity,
    deviceId: sensorData?.deviceId || 'ESP32-SOIL-001',
    createdAt: sensorData?.createdAt,
    loading,
    refreshing,
    refresh,
  };
};
