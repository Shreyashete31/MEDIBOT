#!/usr/bin/env node

/**
 * HealthHub API Testing Script
 * 
 * This script tests the main API endpoints to ensure they're working correctly.
 * Run this after starting the server to verify everything is functioning.
 */

const http = require('http');

const API_BASE = 'http://localhost:3001';
const API_ENDPOINTS = {
  health: '/health',
  remedies: '/api/remedies',
  featuredRemedies: '/api/remedies/featured',
  remedyCategories: '/api/remedies/categories/list',
  firstAid: '/api/first-aid',
  emergencyFirstAid: '/api/first-aid/emergency',
  symptoms: '/api/symptoms',
  symptomAnalysis: '/api/symptoms/analyze'
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Utility function to make HTTP requests
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    
    const requestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Test functions
async function testHealthEndpoint() {
  console.log(`${colors.blue}🔍 Testing Health Endpoint...${colors.reset}`);
  
  try {
    const response = await makeRequest(API_ENDPOINTS.health);
    
    if (response.status === 200 && response.data.status === 'OK') {
      console.log(`${colors.green}✅ Health check passed${colors.reset}`);
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Environment: ${response.data.environment}`);
      return true;
    } else {
      console.log(`${colors.red}❌ Health check failed${colors.reset}`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Response:`, response.data);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Health check error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testRemediesEndpoint() {
  console.log(`${colors.blue}🔍 Testing Remedies Endpoint...${colors.reset}`);
  
  try {
    const response = await makeRequest(API_ENDPOINTS.remedies);
    
    if (response.status === 200 && response.data.success && Array.isArray(response.data.data)) {
      console.log(`${colors.green}✅ Remedies endpoint working${colors.reset}`);
      console.log(`   Found ${response.data.data.length} remedies`);
      console.log(`   Total: ${response.data.pagination.total}`);
      return true;
    } else {
      console.log(`${colors.red}❌ Remedies endpoint failed${colors.reset}`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Response:`, response.data);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Remedies endpoint error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testFeaturedRemedies() {
  console.log(`${colors.blue}🔍 Testing Featured Remedies...${colors.reset}`);
  
  try {
    const response = await makeRequest(API_ENDPOINTS.featuredRemedies);
    
    if (response.status === 200 && response.data.success && Array.isArray(response.data.data)) {
      console.log(`${colors.green}✅ Featured remedies working${colors.reset}`);
      console.log(`   Found ${response.data.data.length} featured remedies`);
      return true;
    } else {
      console.log(`${colors.red}❌ Featured remedies failed${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Featured remedies error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testRemedyCategories() {
  console.log(`${colors.blue}🔍 Testing Remedy Categories...${colors.reset}`);
  
  try {
    const response = await makeRequest(API_ENDPOINTS.remedyCategories);
    
    if (response.status === 200 && response.data.success && Array.isArray(response.data.data)) {
      console.log(`${colors.green}✅ Remedy categories working${colors.reset}`);
      console.log(`   Categories: ${response.data.data.map(c => c.category).join(', ')}`);
      return true;
    } else {
      console.log(`${colors.red}❌ Remedy categories failed${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Remedy categories error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testFirstAidEndpoint() {
  console.log(`${colors.blue}🔍 Testing First Aid Endpoint...${colors.reset}`);
  
  try {
    const response = await makeRequest(API_ENDPOINTS.firstAid);
    
    if (response.status === 200 && response.data.success && Array.isArray(response.data.data)) {
      console.log(`${colors.green}✅ First aid endpoint working${colors.reset}`);
      console.log(`   Found ${response.data.data.length} first aid instructions`);
      return true;
    } else {
      console.log(`${colors.red}❌ First aid endpoint failed${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ First aid endpoint error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testEmergencyFirstAid() {
  console.log(`${colors.blue}🔍 Testing Emergency First Aid...${colors.reset}`);
  
  try {
    const response = await makeRequest(API_ENDPOINTS.emergencyFirstAid);
    
    if (response.status === 200 && response.data.success && Array.isArray(response.data.data)) {
      console.log(`${colors.green}✅ Emergency first aid working${colors.reset}`);
      console.log(`   Found ${response.data.data.length} emergency procedures`);
      return true;
    } else {
      console.log(`${colors.red}❌ Emergency first aid failed${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Emergency first aid error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testSymptomsEndpoint() {
  console.log(`${colors.blue}🔍 Testing Symptoms Endpoint...${colors.reset}`);
  
  try {
    const response = await makeRequest(API_ENDPOINTS.symptoms);
    
    if (response.status === 200 && response.data.success && Array.isArray(response.data.data)) {
      console.log(`${colors.green}✅ Symptoms endpoint working${colors.reset}`);
      console.log(`   Found ${response.data.data.length} symptoms`);
      return true;
    } else {
      console.log(`${colors.red}❌ Symptoms endpoint failed${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Symptoms endpoint error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testSymptomAnalysis() {
  console.log(`${colors.blue}🔍 Testing Symptom Analysis...${colors.reset}`);
  
  try {
    const response = await makeRequest(API_ENDPOINTS.symptomAnalysis, {
      method: 'POST',
      body: {
        symptoms: ['headache', 'fever']
      }
    });
    
    if (response.status === 200 && response.data.success && response.data.data.analyzed_symptoms) {
      console.log(`${colors.green}✅ Symptom analysis working${colors.reset}`);
      console.log(`   Analyzed ${response.data.data.analyzed_symptoms.length} symptoms`);
      console.log(`   Overall severity: ${response.data.data.overall_severity}`);
      return true;
    } else {
      console.log(`${colors.red}❌ Symptom analysis failed${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Symptom analysis error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testRemedyFiltering() {
  console.log(`${colors.blue}🔍 Testing Remedy Filtering...${colors.reset}`);
  
  try {
    const response = await makeRequest(`${API_ENDPOINTS.remedies}?category=Immunity&limit=2`);
    
    if (response.status === 200 && response.data.success) {
      console.log(`${colors.green}✅ Remedy filtering working${colors.reset}`);
      console.log(`   Found ${response.data.data.length} immunity remedies`);
      return true;
    } else {
      console.log(`${colors.red}❌ Remedy filtering failed${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Remedy filtering error: ${error.message}${colors.reset}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log(`${colors.bold}${colors.blue}🚀 HealthHub API Test Suite${colors.reset}`);
  console.log(`${colors.blue}=====================================${colors.reset}`);
  console.log(`Testing API at: ${API_BASE}\n`);

  const tests = [
    { name: 'Health Check', fn: testHealthEndpoint },
    { name: 'Remedies Endpoint', fn: testRemediesEndpoint },
    { name: 'Featured Remedies', fn: testFeaturedRemedies },
    { name: 'Remedy Categories', fn: testRemedyCategories },
    { name: 'First Aid Endpoint', fn: testFirstAidEndpoint },
    { name: 'Emergency First Aid', fn: testEmergencyFirstAid },
    { name: 'Symptoms Endpoint', fn: testSymptomsEndpoint },
    { name: 'Symptom Analysis', fn: testSymptomAnalysis },
    { name: 'Remedy Filtering', fn: testRemedyFiltering }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`${colors.red}❌ ${test.name} crashed: ${error.message}${colors.reset}`);
      failed++;
    }
    console.log(''); // Empty line for readability
  }

  // Summary
  console.log(`${colors.bold}${colors.blue}📊 Test Summary${colors.reset}`);
  console.log(`${colors.blue}===================${colors.reset}`);
  console.log(`${colors.green}✅ Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${failed}${colors.reset}`);
  console.log(`${colors.blue}📈 Total: ${passed + failed}${colors.reset}`);

  if (failed === 0) {
    console.log(`\n${colors.green}${colors.bold}🎉 All tests passed! Your API is working correctly.${colors.reset}`);
    console.log(`\n${colors.yellow}💡 Next steps:${colors.reset}`);
    console.log(`   1. Test with your frontend application`);
    console.log(`   2. Try the API endpoints in Postman`);
    console.log(`   3. Check the README.md for usage examples`);
  } else {
    console.log(`\n${colors.red}${colors.bold}⚠️  Some tests failed. Please check the server logs.${colors.reset}`);
    console.log(`\n${colors.yellow}💡 Troubleshooting tips:${colors.reset}`);
    console.log(`   1. Ensure the server is running: npm start`);
    console.log(`   2. Check if the database is initialized: npm run init-db`);
    console.log(`   3. Verify the server is accessible at ${API_BASE}`);
  }

  console.log(`\n${colors.blue}🔗 API Documentation: ${API_BASE}/api${colors.reset}`);
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };
