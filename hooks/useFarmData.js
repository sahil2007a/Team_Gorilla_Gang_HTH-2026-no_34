import { useState, useEffect, useCallback } from 'react';
import { farmService } from '../services/farmService';

export const useFarmData = (farmId = 'farm_001') => {
  const [farm, setFarm] = useState(null);
  const [crop, setCrop] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [farmRes, cropRes, tasksRes, weatherRes] = await Promise.all([
        farmService.getFarm(farmId),
        farmService.getCrop(farmId),
        farmService.getTasks(farmId),
        farmService.getWeather(farmId),
      ]);
      setFarm(farmRes.data);
      setCrop(cropRes.data);
      setTasks(tasksRes.data);
      setWeather(weatherRes.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [farmId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchAll();
  }, [fetchAll]);

  const completeTask = useCallback(async (taskId) => {
    await farmService.completeTask(taskId);
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: 'completed' } : t))
    );
  }, []);

  return { farm, crop, tasks, weather, loading, refreshing, error, refresh, completeTask };
};
