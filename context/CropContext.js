import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_CROP_KEY = 'agriflow_active_crop';
const CROPS_LIST_KEY = 'agriflow_registered_crops';
const FARM_KEY = 'agriflow_farm_setup';

const CropContext = createContext(null);

export const CROP_CATALOG = [
  { id: 'wheat',     name: 'Wheat',      emoji: '🌾', color: '#F5A623', bgColor: '#FEF6E4', duration: 120, stages: ['Sowing','Germination','Tillering','Heading','Maturation','Harvest'] },
  { id: 'soybean',   name: 'Soybean',    emoji: '🫘', color: '#4A7C3F', bgColor: '#E6F7EE', duration: 110, stages: ['Sowing','Germination','Vegetative','Flowering','Pod Formation','Maturation','Harvest'] },
  { id: 'cotton',    name: 'Cotton',     emoji: '🌿', color: '#6B7F5A', bgColor: '#E8EBE4', duration: 180, stages: ['Sowing','Germination','Squaring','Flowering','Boll Formation','Maturation','Harvest'] },
  { id: 'rice',      name: 'Rice',       emoji: '🍚', color: '#3B82F6', bgColor: '#EAF2FB', duration: 130, stages: ['Nursery','Transplanting','Tillering','Panicle Initiation','Heading','Maturation','Harvest'] },
  { id: 'sugarcane', name: 'Sugarcane',  emoji: '🎋', color: '#10B981', bgColor: '#D1FAE5', duration: 360, stages: ['Planting','Germination','Tillering','Grand Growth','Maturation','Harvest'] },
  { id: 'tomato',    name: 'Tomato',     emoji: '🍅', color: '#EF4444', bgColor: '#FEE2E2', duration: 90,  stages: ['Nursery','Transplanting','Vegetative','Flowering','Fruit Set','Maturation','Harvest'] },
  { id: 'onion',     name: 'Onion',      emoji: '🧅', color: '#A855F7', bgColor: '#F3E8FF', duration: 120, stages: ['Sowing','Germination','Vegetative','Bulb Formation','Maturation','Harvest'] },
  { id: 'maize',     name: 'Maize',      emoji: '🌽', color: '#F59E0B', bgColor: '#FEF3C7', duration: 100, stages: ['Sowing','Germination','Vegetative','Tasseling','Silking','Maturation','Harvest'] },
  { id: 'chilli',    name: 'Chilli',     emoji: '🌶️', color: '#DC2626', bgColor: '#FEE2E2', duration: 150, stages: ['Nursery','Transplanting','Vegetative','Flowering','Fruit Set','Maturation','Harvest'] },
  { id: 'groundnut', name: 'Groundnut',  emoji: '🥜', color: '#92400E', bgColor: '#FEF3C7', duration: 130, stages: ['Sowing','Germination','Vegetative','Flowering','Pegging','Pod Fill','Harvest'] },
  { id: 'banana',    name: 'Banana',     emoji: '🍌', color: '#FBBF24', bgColor: '#FEF9C3', duration: 365, stages: ['Planting','Vegetative','Shooting','Flowering','Bunch Development','Harvest'] },
  { id: 'grapes',    name: 'Grapes',     emoji: '🍇', color: '#7C3AED', bgColor: '#EDE9FE', duration: 180, stages: ['Pruning','Budbreak','Shoot Growth','Flowering','Fruit Set','Veraison','Harvest'] },
];

export const IRRIGATION_SYSTEMS = [
  { id: 'drip',       label: 'Drip',       emoji: '💧', desc: 'Water efficient, targeted' },
  { id: 'sprinkler',  label: 'Sprinkler',  emoji: '🌀', desc: 'Overhead spray coverage' },
  { id: 'flood',      label: 'Flood',      emoji: '🌊', desc: 'Traditional surface flooding' },
  { id: 'rainfed',    label: 'Rain-fed',   emoji: '🌧️', desc: 'Depends on rainfall' },
  { id: 'furrow',     label: 'Furrow',     emoji: '〰️', desc: 'Row-based channel system' },
  { id: 'borewell',   label: 'Borewell',   emoji: '⛽', desc: 'Groundwater extraction' },
];

export const SOIL_TYPES = ['Black Soil', 'Red Soil', 'Sandy Soil', 'Loamy Soil', 'Clay Soil', 'Alluvial Soil'];

export const INDIAN_STATES = [
  'Maharashtra','Madhya Pradesh','Uttar Pradesh','Punjab','Haryana',
  'Rajasthan','Gujarat','Karnataka','Andhra Pradesh','Telangana',
  'Tamil Nadu','West Bengal','Bihar','Odisha','Chhattisgarh',
];

export const CropProvider = ({ children }) => {
  const [crops, setCrops] = useState([]);               // list of all registered crops
  const [activeCrop, setActiveCrop] = useState(null);   // currently selected crop
  const [farmSetup, setFarmSetup] = useState(null);     // farm registration object
  const [loading, setLoading] = useState(true);

  // Load persisted data on mount
  useEffect(() => {
    const load = async () => {
      try {
        const [activeCropJson, cropsListJson, farmJson] = await Promise.all([
          AsyncStorage.getItem(ACTIVE_CROP_KEY),
          AsyncStorage.getItem(CROPS_LIST_KEY),
          AsyncStorage.getItem(FARM_KEY),
        ]);
        
        let loadedCrops = [];
        if (cropsListJson) {
          loadedCrops = JSON.parse(cropsListJson);
          setCrops(loadedCrops);
        }

        if (activeCropJson) {
          const parsedActive = JSON.parse(activeCropJson);
          setActiveCrop(parsedActive);
          // If active crop is not in crops list, append it
          if (!loadedCrops.some((c) => c.id === parsedActive.id)) {
            const updated = [parsedActive, ...loadedCrops];
            setCrops(updated);
            AsyncStorage.setItem(CROPS_LIST_KEY, JSON.stringify(updated));
          }
        } else if (loadedCrops.length > 0) {
          setActiveCrop(loadedCrops[0]);
        }

        if (farmJson) setFarmSetup(JSON.parse(farmJson));
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, []);

  const saveCrop = useCallback(async (cropData) => {
    setActiveCrop(cropData);
    setCrops((prev) => {
      const existingIdx = prev.findIndex((c) => c.id === cropData.id || c.cropId === cropData.cropId && c.fieldName === cropData.fieldName);
      let updated;
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = cropData;
      } else {
        updated = [cropData, ...prev];
      }
      AsyncStorage.setItem(CROPS_LIST_KEY, JSON.stringify(updated));
      return updated;
    });
    await AsyncStorage.setItem(ACTIVE_CROP_KEY, JSON.stringify(cropData));
  }, []);

  const selectCrop = useCallback(async (cropId) => {
    setCrops((prev) => {
      const selected = prev.find((c) => c.id === cropId);
      if (selected) {
        setActiveCrop(selected);
        AsyncStorage.setItem(ACTIVE_CROP_KEY, JSON.stringify(selected));
      }
      return prev;
    });
  }, []);

  const deleteCrop = useCallback(async (cropId) => {
    setCrops((prev) => {
      const updated = prev.filter((c) => c.id !== cropId);
      AsyncStorage.setItem(CROPS_LIST_KEY, JSON.stringify(updated));
      if (activeCrop?.id === cropId) {
        const nextActive = updated.length > 0 ? updated[0] : null;
        setActiveCrop(nextActive);
        if (nextActive) {
          AsyncStorage.setItem(ACTIVE_CROP_KEY, JSON.stringify(nextActive));
        } else {
          AsyncStorage.removeItem(ACTIVE_CROP_KEY);
        }
      }
      return updated;
    });
  }, [activeCrop]);

  const saveFarm = useCallback(async (farmData) => {
    setFarmSetup(farmData);
    await AsyncStorage.setItem(FARM_KEY, JSON.stringify(farmData));
  }, []);

  const clearCropAndFarm = useCallback(async () => {
    setActiveCrop(null);
    setCrops([]);
    setFarmSetup(null);
    await AsyncStorage.multiRemove([ACTIVE_CROP_KEY, CROPS_LIST_KEY, FARM_KEY]);
  }, []);

  return (
    <CropContext.Provider value={{
      crops,
      activeCrop,
      farmSetup,
      loading,
      saveCrop,
      selectCrop,
      deleteCrop,
      saveFarm,
      clearCropAndFarm
    }}>
      {children}
    </CropContext.Provider>
  );
};

export const useCrop = () => {
  const ctx = useContext(CropContext);
  if (!ctx) throw new Error('useCrop must be inside CropProvider');
  return ctx;
};
