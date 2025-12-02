'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { WebSocketMessage, ChatOptions } from '@/types/chat';

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    connectionState, 
    isConnecting, 
    setConnectionState, 
    setIsConnecting,
    lastConnectedServer,
    autoReconnect
  } = useChatStore();
  
  const wsRef = useRef<WebSocket | null>(null);
  const messageHandlersRef = useRef<Map<string, (data: any) => void>>(new Map());

  const connect = useCallback(async (serverUrl: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      await disconnect();
    }

    setIsConnecting(true);
    setConnectionState((prev: any) => ({ 
      ...prev, 
      connected: false, 
      error: undefined 
    }));

    try {
      // Connect to our backend WebSocket server
      const ws = new WebSocket('ws://localhost:3002');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected to backend');
        // Send connect message to backend
        const connectMessage = {
          type: 'connect',
          serverUrl
        };
        console.log('Sending connect message:', connectMessage);
        ws.send(JSON.stringify(connectMessage));
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          console.log('Message type:', data.type, 'Content:', data.content || 'N/A');

          switch (data.type) {
            case 'connected':
              setConnectionState({
                connected: true,
                serverUrl,
                model: 'default'
              });
              setIsConnecting(false);
              break;
            
            case 'error':
              setConnectionState((prev: any) => ({
                ...prev,
                connected: false,
                error: data.message
              }));
              setIsConnecting(false);
              break;

            default:
              // Handle other message types through registered handlers
              const handler = messageHandlersRef.current.get(data.type);
              if (handler) {
                handler(data);
              }
              break;
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionState((prev: any) => ({
          ...prev,
          connected: false
        }));
        setIsConnecting(false);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionState((prev: any) => ({
          ...prev,
          connected: false,
          error: 'Connection failed'
        }));
        setIsConnecting(false);
      };

    } catch (error) {
      console.error('Failed to connect:', error);
      setConnectionState((prev: any) => ({
        ...prev,
        connected: false,
        error: 'Failed to connect to server'
      }));
      setIsConnecting(false);
    }
  }, [setConnectionState, setIsConnecting]);

  const disconnect = useCallback(async () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnectionState({
      connected: false,
      serverUrl: '',
      model: '',
    });
  }, [setConnectionState]);

  const sendMessage = useCallback((message: string, options?: ChatOptions) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to server');
    }

    wsRef.current.send(JSON.stringify({
      type: 'message',
      message,
      options
    }));
  }, []);

  const onMessage = useCallback((type: string, handler: (data: any) => void) => {
    messageHandlersRef.current.set(type, handler);
    
    return () => {
      messageHandlersRef.current.delete(type);
    };
  }, []);

  const offMessage = useCallback((type: string) => {
    messageHandlersRef.current.delete(type);
  }, []);

  // Auto-reconnection logic
  useEffect(() => {
    // Only attempt auto-reconnect if:
    // 1. Auto-reconnect is enabled
    // 2. We have a last connected server
    // 3. We're not currently connected
    // 4. We're not currently connecting
    if (autoReconnect && lastConnectedServer && !connectionState.connected && !isConnecting) {
      // Small delay to ensure the app is fully loaded
      const timer = setTimeout(() => {
        console.log('Attempting auto-reconnection to:', lastConnectedServer);
        connect(lastConnectedServer);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [autoReconnect, lastConnectedServer, connectionState.connected, isConnecting, connect]);

  // Make WebSocket functions available globally
  useEffect(() => {
    (window as any).websocketAPI = {
      connect,
      disconnect,
      sendMessage,
      onMessage,
      offMessage,
    };
  }, [connect, disconnect, sendMessage, onMessage, offMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return <>{children}</>;
};