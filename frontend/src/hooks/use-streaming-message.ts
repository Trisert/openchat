'use client';

import { useState, useCallback, useRef } from 'react';
import { useWebSocket } from './use-websocket';
import { useChatStore } from '@/stores/chat-store';
import { ChatOptions } from '@/types/chat';

export const useStreamingMessage = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamingId, setCurrentStreamingId] = useState<string | null>(null);
  const { sendMessage, onMessage, offMessage } = useWebSocket();
  const { addMessage, updateMessage } = useChatStore();
  const streamBufferRef = useRef<string>('');
  const currentStreamingIdRef = useRef<string | null>(null);

  const startStreaming = useCallback(async (message: string, options?: ChatOptions) => {
    try {
      setIsStreaming(true);
      streamBufferRef.current = '';

      // Add user message
      addMessage({
        role: 'user',
        content: message,
      });

      // Add empty assistant message for streaming
      const assistantMessage = addMessage({
        role: 'assistant',
        content: '',
        isStreaming: true,
      });
      const assistantMessageId = assistantMessage.id;
      setCurrentStreamingId(assistantMessageId);
      currentStreamingIdRef.current = assistantMessageId;

      // Register message handlers
      const handleResponseStart = () => {
        console.log('Response started');
      };

      const handleResponseChunk = (data: { content?: string }) => {
        if (data.content && currentStreamingIdRef.current) {
          streamBufferRef.current += data.content;
          updateMessage(currentStreamingIdRef.current, {
            content: streamBufferRef.current,
          });
        }
      };

      const handleResponseEnd = () => {
        if (currentStreamingIdRef.current) {
          updateMessage(currentStreamingIdRef.current, {
            isStreaming: false,
          });
        }
        setIsStreaming(false);
        setCurrentStreamingId(null);
        currentStreamingIdRef.current = null;
        streamBufferRef.current = '';
        
        // Clean up message handlers
        offMessage('response_start');
        offMessage('response_chunk');
        offMessage('response_end');
      };

      const handleError = (data: { message?: string }) => {
        console.error('Streaming error:', data.message);
        if (currentStreamingIdRef.current) {
          updateMessage(currentStreamingIdRef.current, {
            content: `Error: ${data.message || 'Failed to get response'}`,
            isStreaming: false,
          });
        }
        setIsStreaming(false);
        setCurrentStreamingId(null);
        currentStreamingIdRef.current = null;
        streamBufferRef.current = '';
        
        // Clean up message handlers
        offMessage('response_start');
        offMessage('response_chunk');
        offMessage('response_end');
        offMessage('error');
      };

      // Register message handlers
      onMessage('response_start', handleResponseStart);
      onMessage('response_chunk', handleResponseChunk);
      onMessage('response_end', handleResponseEnd);
      onMessage('error', handleError);

      // Send the message
      sendMessage(message, options);

    } catch (error) {
      console.error('Failed to start streaming:', error);
      setIsStreaming(false);
      setCurrentStreamingId(null);
      
      // Add error message
      addMessage({
        role: 'assistant',
        content: `Error: Failed to send message. ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }, [sendMessage, onMessage, offMessage, addMessage, updateMessage, currentStreamingId]);

  const stopStreaming = useCallback(() => {
    if (currentStreamingIdRef.current) {
      updateMessage(currentStreamingIdRef.current, {
        isStreaming: false,
      });
    }
    setIsStreaming(false);
    setCurrentStreamingId(null);
    currentStreamingIdRef.current = null;
    streamBufferRef.current = '';
    
    // Clean up message handlers
    offMessage('response_start');
    offMessage('response_chunk');
    offMessage('response_end');
    offMessage('error');
  }, [updateMessage, offMessage]);

  return {
    isStreaming,
    currentStreamingId,
    startStreaming,
    stopStreaming,
  };
};