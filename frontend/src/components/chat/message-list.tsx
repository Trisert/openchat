'use client';

import React, { useEffect, useRef } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { MessageBubble } from './message-bubble';

export const MessageList: React.FC = () => {
  const { messages } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1" />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="space-y-1">
        {messages.map((message) => (
          <MessageBubble key={`${message.id}-${message.content.length}-${message.isStreaming}`} message={message} />
        ))}
      </div>
      <div ref={messagesEndRef} />
    </div>
  );
};