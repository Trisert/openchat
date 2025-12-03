'use client';

import { useCallback } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { ChatOptions } from '@/types/chat';

export const useWebSocket = () => {
  const { 
    connectionState, 
    isConnecting, 
    setConnectionState, 
    setIsConnecting 
  } = useChatStore();

  const connect = useCallback(async (serverUrl: string) => {
    const api = (window as any).websocketAPI;
    if (!api) {
      throw new Error('WebSocket provider not initialized');
    }
    await api.connect(serverUrl);
  }, []);

  const disconnect = useCallback(async () => {
    const api = (window as any).websocketAPI;
    if (!api) {
      throw new Error('WebSocket provider not initialized');
    }
    await api.disconnect();
  }, []);

  const sendMessage = useCallback((message: string, options?: ChatOptions, enableWebSearch?: boolean) => {
    const api = (window as any).websocketAPI;
    if (!api) {
      throw new Error('WebSocket provider not initialized');
    }
    return api.sendMessage(message, options, enableWebSearch);
  }, []);

  const onMessage = useCallback((type: string, handler: (data: any) => void) => {
    const api = (window as any).websocketAPI;
    if (!api) {
      throw new Error('WebSocket provider not initialized');
    }
    return api.onMessage(type, handler);
  }, []);

  const offMessage = useCallback((type: string) => {
    const api = (window as any).websocketAPI;
    if (!api) {
      throw new Error('WebSocket provider not initialized');
    }
    return api.offMessage(type);
  }, []);

  return {
    connectionState,
    isConnecting,
    connect,
    disconnect,
    sendMessage,
    onMessage,
    offMessage,
  };
};