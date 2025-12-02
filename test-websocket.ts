#!/usr/bin/env bun

// Test WebSocket connection to the backend
const ws = new WebSocket('ws://localhost:3002');

ws.onopen = () => {
  console.log('✅ Connected to WebSocket server');
  
  // Test connection to LLaMA.cpp server
  ws.send(JSON.stringify({
    type: 'connect',
    serverUrl: 'http://localhost:8080'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('📨 Received:', data);
  
  if (data.type === 'connected') {
    console.log('🎉 Connection successful!');
    ws.close();
  }
  
  if (data.type === 'error') {
    console.log('❌ Connection failed:', data.message);
    ws.close();
  }
};

ws.onerror = (error) => {
  console.log('❌ WebSocket error:', error);
};

ws.onclose = () => {
  console.log('🔌 WebSocket connection closed');
};

console.log('🔄 Testing WebSocket connection...');