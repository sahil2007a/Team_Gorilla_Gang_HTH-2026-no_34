import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const AUTH_KEY = 'agriflow_auth';

function getHostIp() {
  try {
    const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || Constants.manifest2?.extra?.expoGo?.debuggerHost;
    if (debuggerHost) {
      const host = debuggerHost.split(':')[0];
      if (host && !host.includes('localhost') && !host.includes('127.0.0.1') && !host.includes('exp.direct')) {
        return host;
      }
    }
  } catch (e) {
    // Ignore error
  }
  return '10.160.182.80';
}

export function getBaseUrl() {
  if (Platform.OS === 'web') {
    return 'http://127.0.0.1:8001';
  }
  const host = getHostIp();
  return `http://${host}:8002/proxy`;
}

export function getDirectUrl() {
  if (Platform.OS === 'web') {
    return 'http://127.0.0.1:8001';
  }
  const host = getHostIp();
  return `http://${host}:8001`;
}

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem(AUTH_KEY);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchWithFallback(endpoint, options = {}) {
  // Use fast timeout (3.5s max) so offline/unreachable servers fail over immediately without freezing the app
  const timeoutMs = options.timeout || (endpoint.includes('sensors') ? 2000 : 3500);

  const urls = [
    `${getDirectUrl()}${endpoint}`,
    `${getBaseUrl()}${endpoint}`
  ];

  let lastError = null;

  for (const url of urls) {
    try {
      if (!endpoint.includes('sensors')) {
        console.log(`[API Request] -> ${url} (timeout: ${timeoutMs}ms)`);
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeoutMs);

      const fetchOptions = {
        ...options,
        signal: controller.signal,
      };

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || data.message || `HTTP ${response.status}`);
      }
      return data;
    } catch (err) {
      if (!endpoint.includes('sensors')) {
        console.log(`[API Attempt info on ${url}]:`, err.message);
      }
      lastError = err;
      // If direct port 8001 failed with network/abort error on local IP, proxy port 8002 on same IP will also fail; avoid redundant hang
      if (err.name === 'AbortError' || err.message?.includes('Network request failed') || err.message?.includes('Fetch request has been canceled')) {
        break;
      }
    }
  }

  throw lastError || new Error('Could not connect to server.');
}

export const apiClient = {
  get: async (endpoint, customOptions = {}) => {
    const headers = await getAuthHeaders();
    return await fetchWithFallback(endpoint, { headers, ...customOptions });
  },
  post: async (endpoint, body, customOptions = {}) => {
    const headers = await getAuthHeaders();
    return await fetchWithFallback(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      ...customOptions,
    });
  },
  put: async (endpoint, body, customOptions = {}) => {
    const headers = await getAuthHeaders();
    return await fetchWithFallback(endpoint, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
      ...customOptions,
    });
  },
  delete: async (endpoint, customOptions = {}) => {
    const headers = await getAuthHeaders();
    return await fetchWithFallback(endpoint, {
      method: 'DELETE',
      headers,
      ...customOptions,
    });
  },
};

export const ADMIN_AUTH_KEY = 'agriflow_admin_auth';

async function getAdminHeaders() {
  const token = await AsyncStorage.getItem(ADMIN_AUTH_KEY);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const adminClient = {
  get: async (endpoint, customOptions = {}) => {
    const headers = await getAdminHeaders();
    return await fetchWithFallback(endpoint, { headers, ...customOptions });
  },
  post: async (endpoint, body, customOptions = {}) => {
    const headers = await getAdminHeaders();
    return await fetchWithFallback(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      ...customOptions,
    });
  },
  put: async (endpoint, body, customOptions = {}) => {
    const headers = await getAdminHeaders();
    return await fetchWithFallback(endpoint, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
      ...customOptions,
    });
  },
  delete: async (endpoint, customOptions = {}) => {
    const headers = await getAdminHeaders();
    return await fetchWithFallback(endpoint, {
      method: 'DELETE',
      headers,
      ...customOptions,
    });
  },
};
