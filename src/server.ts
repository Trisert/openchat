import { Elysia } from 'elysia';
import { staticPlugin } from '@elysiajs/static';
import { LlamaService } from './services/llama-service';

interface WebSocketData {
  connected: boolean;
  serverUrl?: string;
  llamaService: LlamaService;
}

const app = new Elysia()
  .use(staticPlugin({
    assets: 'frontend/.next/static',
    prefix: '/_next/static',
  }))
  .get('/_next/*', ({ params }) => {
    const path = params['*'];
    return Bun.file(`frontend/.next/${path}`);
  })
  .get('/favicon.ico', () => {
    return Bun.file('frontend/.next/server/favicon.ico.body');
  })
  .all('/*', () => {
    return Bun.file('frontend/.next/server/app/index.html');
  })
  .listen(3001);

// WebSocket connections storage
const connections = new Set<any>();
const llamaService = new LlamaService();

// Create WebSocket server using Bun.serve
Bun.serve({
  port: 3002,
  fetch(req, server) {
    // Upgrade to WebSocket
    const upgraded = server.upgrade(req);
    if (upgraded) {
      return undefined; // WebSocket connection successful
    }
    return new Response("Upgrade failed", { status: 500 });
  },
  websocket: {
    message(ws: any, message) {
      handleWebSocketMessage(ws, message);
    },
    open(ws: any) {
      console.log('WebSocket connection opened');
      connections.add(ws);
      ws.data = {
        connected: false,
        llamaService: llamaService
      };
    },
    close(ws: any) {
      console.log('WebSocket connection closed');
      connections.delete(ws);
    }
  }
});

async function handleWebSocketMessage(ws: any, message: string | Buffer) {
  try {
    console.log('Raw WebSocket message received:', message);
    console.log('Message type:', typeof message, 'Is Buffer?:', Buffer.isBuffer(message));
    
    // Handle potential binary data or malformed messages
    let messageStr: string;
    if (message instanceof Buffer) {
      messageStr = message.toString();
    } else if (typeof message === 'string') {
      messageStr = message;
    } else {
      console.error('Invalid message type:', typeof message);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
      return;
    }
    
    // Try to parse JSON with better error handling
    let data;
    try {
      data = JSON.parse(messageStr);
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Message:', messageStr);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid JSON format'
      }));
      return;
    }
    
    switch (data.type) {
      case 'connect':
        await handleConnect(ws, data);
        break;
      case 'message':
        await handleMessage(ws, data);
        break;
      default:
        ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
    }
  } catch (error) {
    console.error('Error processing message:', error);
    ws.send(JSON.stringify({ 
      type: 'error', 
      message: 'Invalid message format' 
    }));
  }
}

async function handleConnect(ws: any, data: any) {
  try {
    console.log('Received connect request:', data);
    const { serverUrl } = data;
    
    // Test connection to llama.cpp server using LlamaService
    try {
      const connected = await ws.data.llamaService.connect(serverUrl, 'default');
      
      if (connected) {
        ws.data.connected = true;
        ws.data.serverUrl = serverUrl;
        
        const response = {
          type: 'connected',
          message: 'Successfully connected to LLaMA.cpp server'
        };
        console.log('Sending response:', response);
        ws.send(JSON.stringify(response));
      } else {
        throw new Error('Server connection failed');
      }
    } catch (error) {
      console.error('Connection error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Connection failed: ' + (error as Error).message
      }));
    }
  } catch (error) {
    console.error('Connection error:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Connection failed: ' + (error as Error).message
    }));
  }
}

async function handleMessage(ws: any, data: any) {
  if (!ws.data.connected) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Not connected to any server'
    }));
    return;
  }

  try {
    const { message, options } = data;
    
    // Send user message confirmation
    ws.send(JSON.stringify({
      type: 'message_received',
      message: 'Message received, processing...'
    }));

    // Stream response from llama.cpp
    const stream = await ws.data.llamaService.sendMessage(message, options);
    
    ws.send(JSON.stringify({
      type: 'response_start',
      message: ''
    }));

    let chunkCount = 0;
    for await (const chunk of stream) {
      console.log(`Sending chunk ${++chunkCount}:`, chunk);
      ws.send(JSON.stringify({
        type: 'response_chunk',
        content: chunk
      }));
    }

    console.log(`Stream completed with ${chunkCount} chunks`);
    ws.send(JSON.stringify({
      type: 'response_end',
      message: 'Response complete'
    }));
  } catch (error) {
    console.error('Message handling error:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to process message: ' + (error as Error).message
    }));
  }
}

console.log(`🦊 OpenChat server is running at http://localhost:${app.server?.port}`);
console.log(`🔌 WebSocket server running on port 3002`);
console.log(`📝 Demo mode: The interface will work without a real LLaMA.cpp server for testing`);

export type App = typeof app;