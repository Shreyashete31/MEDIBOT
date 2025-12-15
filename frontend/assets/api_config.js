// API Configuration

/**
 * Offline WebView configuration: BASE_URL ignored, local assets used
 */
const API_CONFIG = {
  BASE_URL: 'offline',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  GOOGLE_CLIENT_ID: '455059237598-3m7hau4maupqe57gbpa3tkk8t512m541.apps.googleusercontent.com',
  MAPS_API_KEY: 'AIzaSyB8VoJZmeh79TYEFM4wcUUdOsU-ltz_UM0'
};

const __isAndroidAppAssets = (function(){
  try {
    return String(window.location.host || '').includes('appassets.androidplatform.net');
  } catch (_) { return false; }
})();

const BASE_ASSET_PATH = (function(){
  try {
    var isFile = String(location.protocol) === 'file:';
    var isAndroidAssetsHost = __isAndroidAppAssets === true;
    return (isFile || isAndroidAssetsHost) ? 'assets/' : '/frontend/assets/';
  } catch(_) { return '/frontend/assets/'; }
})();
window.BASE_ASSET_PATH = BASE_ASSET_PATH;

function fetchLocalJSON(path) {
  return new Promise(function(resolve, reject) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', path, true);
      xhr.responseType = 'text';
      xhr.onload = function() {
        // In WebView, status may be 0 for local file reads
        if (xhr.status === 0 || (xhr.status >= 200 && xhr.status < 300)) {
          try {
            var data = JSON.parse(xhr.responseText || '[]');
            resolve(data);
          } catch (e) {
            reject(e);
          }
        } else {
          reject(new Error('Failed to load ' + path + ' (status ' + xhr.status + ')'));
        }
      };
      xhr.onerror = function() { reject(new Error('Network error loading ' + path)); };
      xhr.send();
    } catch (err) {
      reject(err);
    }
  });
}

async function apiCall(endpoint, options = {}) {
  const e = String(endpoint || '').toLowerCase();
  if (e.includes('remedies')) return await getOfflineRemedies();
  if (e.includes('first-aid') || e.includes('firstaid')) return await getOfflineFirstAid();
  if (e.includes('symptoms')) return await getOfflineSymptoms();
  if (e.includes('quiz')) return await getOfflineQuiz();
  return { success: false, message: 'Offline mode: endpoint not available', endpoint };
}

async function getOfflineRemedies() {
  try {
    const d = localStorage.getItem('remediesData');
    if (d) return { success:true, data: JSON.parse(d) };
    const data = await fetchLocalJSON(BASE_ASSET_PATH + 'remedies_data.json');
    if (data) { const arr = Array.isArray(data) ? data : (data.data || data.items || []); localStorage.setItem('remediesData', JSON.stringify(arr)); return { success:true, data: arr }; }
  } catch (_) {}
  return { success:false, message:'No offline data available' };
}

async function getOfflineFirstAid() {
  try {
    const d = localStorage.getItem('firstAidData');
    if (d) return { success:true, data: JSON.parse(d) };
    const data = await fetchLocalJSON(BASE_ASSET_PATH + 'first_aid_data.json');
    if (data) { const arr = Array.isArray(data) ? data : (data.data || data.items || []); localStorage.setItem('firstAidData', JSON.stringify(arr)); return { success:true, data: arr }; }
  } catch (_) {}
  return { success:false, message:'No offline data available' };
}

async function getOfflineSymptoms() {
  try {
    const d = localStorage.getItem('symptomsData');
    if (d) return { success:true, data: JSON.parse(d) };
    const data = await fetchLocalJSON(BASE_ASSET_PATH + 'symptoms_data.json');
    if (data) { const arr = Array.isArray(data) ? data : (data.data || data.items || []); localStorage.setItem('symptomsData', JSON.stringify(arr)); return { success:true, data: arr }; }
  } catch (_) {}
  return { success:false, message:'No offline data available' };
}

async function getOfflineQuiz() {
  try {
    const d = localStorage.getItem('quizQuestions');
    if (d) return { success:true, data: JSON.parse(d) };
    const data = await fetchLocalJSON(BASE_ASSET_PATH + 'quiz_first_aid.json');
    if (data) {
      const arr = Array.isArray(data) ? data : (data.data || data.items || []);
      localStorage.setItem('quizQuestions', JSON.stringify(arr));
      return { success:true, data: arr };
    }
  } catch (_) {}
  return { success:false, message:'No offline data available' };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { API_CONFIG, apiCall, getMapsApiKey, setMapsApiKey };
} else {
  window.API_CONFIG = API_CONFIG;
  window.apiCall = apiCall;
  window.getMapsApiKey = getMapsApiKey;
  window.setMapsApiKey = setMapsApiKey;
}

function getMapsApiKey() { try { const ls = localStorage.getItem('GOOGLE_MAPS_API_KEY'); if (ls && ls.trim()) return ls.trim(); } catch(e) {} return (API_CONFIG && API_CONFIG.MAPS_API_KEY) ? API_CONFIG.MAPS_API_KEY : ''; }
function setMapsApiKey(k) { try { if (typeof k === 'string' && k.trim()) { localStorage.setItem('GOOGLE_MAPS_API_KEY', k.trim()); return true; } } catch(e) {} return false; }