// Simple WebSocket test
const ws = new WebSocket('ws://localhost:3000/api/chat/ws');

ws.onopen = () => {
  console.log('WebSocket opened');
  const message = {
    type: 'connect',
    serverUrl: 'http://localhost:8080'
  };
  console.log('Sending:', JSON.stringify(message));
  ws.send(JSON.stringify(message));
};

ws.onmessage = (event) => {
  console.log('Received:', event.data);
  ws.close();
};

ws.onerror = (error) => {
  console.log('Error:', error);
};

setTimeout(() => {
  console.log('Test timeout');
  process.exit(0);
}, 5000);