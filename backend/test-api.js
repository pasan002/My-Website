const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAPI() {
  try {
    console.log('🧪 Testing API endpoints...\n');

    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL.replace('/api', '')}/health`);
    console.log('✅ Health check:', healthResponse.data);

    // Test 2: Register a user
    console.log('\n2. Testing user registration...');
    const registerData = {
      username: 'testuser5',
      email: 'test5@example.com',
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'organizer'
    };

    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, registerData);
    console.log('✅ User registered:', registerResponse.data.data.user.email);

    // Test 3: Login
    console.log('\n3. Testing user login...');
    const loginData = {
      email: 'test5@example.com',
      password: 'Test123!'
    };

    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    const token = loginResponse.data.data.token;
    console.log('✅ User logged in, token received');

    // Test 4: Create an event
    console.log('\n4. Testing event creation...');
    const eventData = {
      title: 'Test Event',
      description: 'This is a test event for the Smart Waste Management system',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      time: '10:00',
      location: 'Test Location',
      category: 'workshop',
      maxAttendees: 50,
      price: 0
    };

    const eventResponse = await axios.post(`${BASE_URL}/events`, eventData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Event created:', eventResponse.data.data.event.title);

    // Test 5: Get events
    console.log('\n5. Testing get events...');
    const eventsResponse = await axios.get(`${BASE_URL}/events`);
    console.log('✅ Events retrieved:', eventsResponse.data.data.events.length, 'events found');

    console.log('\n🎉 All API tests passed!');

  } catch (error) {
    console.error('❌ API test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testAPI();
