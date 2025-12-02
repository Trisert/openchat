#!/usr/bin/env node

// Test the simplified connection without model selection
console.log('🧪 Testing Simplified OpenChat Connection...\n');

async function testDirectConnection() {
  try {
    // Test that server is running
    const response = await fetch('http://localhost:3000/');
    if (response.ok) {
      console.log('✅ Server is running');
    }

    // Test that model selection is removed
    const html = await response.text();
    if (!html.includes('model-select') && !html.includes('Select a model')) {
      console.log('✅ Model selection removed from interface');
    } else {
      console.log('❌ Model selection still present');
    }

    // Test WebSocket connection
    const ws = new WebSocket('ws://localhost:3000/api/chat/ws');
    
    ws.onopen = () => {
      console.log('✅ WebSocket connection established');
      
      // Test direct connection without model
      ws.send(JSON.stringify({
        type: 'connect',
        serverUrl: 'http://localhost:8080'
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'connected') {
        console.log('✅ Direct server connection successful');
        console.log(`   Message: ${data.message}`);
        ws.close();
      } else if (data.type === 'error') {
        console.log('❌ Connection failed:', data.message);
        ws.close();
      }
    };

    ws.onerror = () => {
      console.log('❌ WebSocket connection failed');
    };

    // Wait for connection test
    await new Promise(resolve => setTimeout(resolve, 3000));

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testDirectConnection().then(() => {
  console.log('\n🎉 Simplified connection test completed!');
  console.log('📱 Open http://localhost:3000 in your browser');
  console.log('💡 Now you can connect directly to any LLaMA.cpp server URL');
  
  // Cleanup
  process.exit(0);
});