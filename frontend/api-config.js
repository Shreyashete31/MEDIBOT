// API Configuration

 const API_CONFIG = {
  BASE_URL: 'http://localhost:3001/api',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  GOOGLE_CLIENT_ID: '455059237598-3m7hau4maupqe57gbpa3tkk8t512m541.apps.googleusercontent.com',
  MAPS_API_KEY: 'AIzaSyB8VoJZmeh79TYEFM4wcUUdOsU-ltz_UM0'
};

// Helper function to make API calls with error handling
async function apiCall(endpoint, options = {}) {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: API_CONFIG.TIMEOUT,
    mode: 'cors'
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    const response = await fetch(url, mergedOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    // Fallback to 127.0.0.1 if localhost fails
    try {
      const altUrl = url.replace('http://localhost', 'http://127.0.0.1');
      const responseAlt = await fetch(altUrl, mergedOptions);
      if (responseAlt.ok) {
        return await responseAlt.json();
      }
    } catch (e2) {
      console.error(`Alternate host failed for ${endpoint}:`, e2);
    }

    // Return offline fallback data if available
    if (endpoint.includes('/remedies')) {
      return getOfflineRemedies();
    } else if (endpoint.includes('/first-aid')) {
      return getOfflineFirstAid();
    } else if (endpoint.includes('/symptoms')) {
      return getOfflineSymptoms();
    }
    
    throw error;
  }
}

// Offline fallback functions
function getOfflineRemedies() {
  try {
    const data = localStorage.getItem('remediesData');
    return data ? { success: true, data: JSON.parse(data) } : { success: false, message: 'No offline data available' };
  } catch (error) {
    return { success: false, message: 'Failed to load offline data' };
  }
}

function getOfflineFirstAid() {
  try {
    const data = localStorage.getItem('firstAidData');
    return data ? { success: true, data: JSON.parse(data) } : { success: false, message: 'No offline data available' };
  } catch (error) {
    return { success: false, message: 'Failed to load offline data' };
  }
}

function getOfflineSymptoms() {
  try {
    const data = localStorage.getItem('symptomsData');
    return data ? { success: true, data: JSON.parse(data) } : { success: false, message: 'No offline data available' };
  } catch (error) {
    return { success: false, message: 'Failed to load offline data' };
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { API_CONFIG, apiCall, getMapsApiKey, setMapsApiKey };
} else {
  window.API_CONFIG = API_CONFIG;
  window.apiCall = apiCall;
  window.getMapsApiKey = getMapsApiKey;
  window.setMapsApiKey = setMapsApiKey;
}

function getMapsApiKey() {
  try {
    const ls = localStorage.getItem('GOOGLE_MAPS_API_KEY');
    if (ls && ls.trim()) return ls.trim();
  } catch(e) {}
  return (API_CONFIG && API_CONFIG.MAPS_API_KEY) ? API_CONFIG.MAPS_API_KEY : '';
}

function setMapsApiKey(k) {
  try {
    if (typeof k === 'string' && k.trim()) {
      localStorage.setItem('GOOGLE_MAPS_API_KEY', k.trim());
      return true;
    }
  } catch(e) {}
  return false;
}

