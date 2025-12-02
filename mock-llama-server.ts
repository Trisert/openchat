#!/usr/bin/env bun

// Mock LLaMA.cpp server for testing
const server = Bun.serve({
  port: 8080,
  fetch(req) {
    const url = new URL(req.url);
    
    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response('OK', { status: 200 });
    }
    
    // Models endpoint
    if (url.pathname === '/v1/models') {
      return new Response(JSON.stringify({
        object: 'list',
        data: [
          {
            id: 'test-model',
            object: 'model',
            created: Date.now(),
            owned_by: 'local'
          }
        ]
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Completion endpoint
    if (url.pathname === '/completion') {
      return new Response(
        `data: {"content": "Hello! This is a test response from the mock LLaMA.cpp server. The streaming is working correctly!"}\n` +
        `data: {"content": " You can now see your messages appearing in real-time."}\n` +
        `data: {"content": " Try typing another message to test the streaming functionality."}\n` +
        `data: {"content": ""}\n`,
        {
          headers: { 
            'Content-Type': 'text/plain',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          }
        }
      );
    }
    
    return new Response('Not Found', { status: 404 });
  }
});

console.log('🤖 Mock LLaMA.cpp server running at http://localhost:8080');
console.log('📝 This is for testing the React frontend only');