import { Elysia } from 'elysia';
import { LlamaService } from '../services/llama-service';

const llamaService = new LlamaService();

export const chatRoutes = new Elysia({ prefix: '/api/chat' })
  .ws('/ws', {
    open(ws) {
      console.log('WebSocket connection opened');
      (ws as any).data = { llamaService };
    },
    message(ws, message) {
      try {
        const data = JSON.parse(message as string);
        
        switch (data.type) {
          case 'connect':
            handleConnect(ws, data);
            break;
          case 'message':
            handleMessage(ws, data);
            break;
          case 'disconnect':
            handleDisconnect(ws);
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
    },
    close(ws) {
      console.log('WebSocket connection closed');
      handleDisconnect(ws);
    }
  });

async function handleConnect(ws: any, data: any) {
  try {
    const { serverUrl, model } = data;
    
    // Test connection to llama.cpp server
    const connected = await (ws as any).data.llamaService.connect(serverUrl, model);
    
    if (connected) {
      (ws as any).data.connected = true;
      (ws as any).data.serverUrl = serverUrl;
      (ws as any).data.model = model;
      
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Successfully connected to LLaMA.cpp server'
      }));
    } else {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to connect to LLaMA.cpp server'
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
  if (!(ws as any).data.connected) {
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
    const stream = await (ws as any).data.llamaService.sendMessage(message, options);
    
    ws.send(JSON.stringify({
      type: 'response_start',
      message: ''
    }));

    for await (const chunk of stream) {
      ws.send(JSON.stringify({
        type: 'response_chunk',
        content: chunk
      }));
    }

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

function handleDisconnect(ws: any) {
  if ((ws as any).data?.connected) {
    (ws as any).data.llamaService.disconnect();
    (ws as any).data.connected = false;
  }
}