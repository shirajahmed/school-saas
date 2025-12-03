const axios = require('axios');

// Test notification creation
async function testNotification() {
  try {
    // Replace with your actual JWT token
    const token = 'YOUR_JWT_TOKEN_HERE';
    
    const response = await axios.post('http://localhost:3001/api/notifications', {
      title: 'School Admin Test',
      message: 'Testing notifications from School Admin',
      type: 'ANNOUNCEMENT',
      channels: ['IN_APP'],
      targetType: 'ALL_USERS'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Notification created:', response.data);
  } catch (error) {
    console.error('❌ Error creating notification:', error.response?.data || error.message);
  }
}

// Test notification endpoint
async function testEndpoint() {
  try {
    const response = await axios.get('http://localhost:3001/api/health');
    console.log('✅ API is running:', response.data);
  } catch (error) {
    console.error('❌ API not accessible:', error.message);
  }
}

// Run tests
console.log('🧪 Testing notification system...');
testEndpoint();
// testNotification(); // Uncomment and add your token to test
