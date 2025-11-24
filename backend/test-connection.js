const mongoose = require('mongoose');

// Test MongoDB Atlas connection
async function testConnection() {
  try {
    console.log('🔄 Testing MongoDB Atlas connection...');
    
    // Replace YOUR_ACTUAL_PASSWORD with your real password
    const mongoURI = 'mongodb+srv://achi:achi%40456@cluster0.gpd2z4o.mongodb.net/smart_waste_management?retryWrites=true&w=majority&appName=Cluster0';
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB Atlas Connected Successfully!');
    console.log(`📍 Host: ${conn.connection.host}`);
    console.log(`🗄️  Database: ${conn.connection.name}`);
    console.log(`🔗 Connection State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    
    // Test a simple operation
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`📋 Collections: ${collections.length} found`);
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB Atlas');
    
  } catch (error) {
    console.error('❌ MongoDB Atlas Connection Failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n💡 Solution: Replace "YOUR_ACTUAL_PASSWORD" with your real MongoDB Atlas password');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Solution: Check your internet connection and MongoDB Atlas cluster status');
    } else if (error.message.includes('bad auth')) {
      console.log('\n💡 Solution: Verify your username and password in MongoDB Atlas');
    }
  }
}

// Run the test
testConnection();
