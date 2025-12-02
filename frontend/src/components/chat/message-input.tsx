'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useWebSocket } from '@/hooks/use-websocket';
import { useStreamingMessage } from '@/hooks/use-streaming-message';
import { useChatStore } from '@/stores/chat-store';
import { Send, Square, Paperclip, Mic, Smile, WifiOff, Loader2 } from 'lucide-react';

export const MessageInput: React.FC = () => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { connectionState, isConnecting } = useWebSocket();
  const { isStreaming, startStreaming, stopStreaming } = useStreamingMessage();
  const { chatSettings } = useChatStore();

  const handleSend = async () => {
    if (!message.trim() || isStreaming || !connectionState.connected) return;

    const messageContent = message.trim();
    setMessage('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await startStreaming(messageContent, chatSettings);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      // For now, just add a message indicating file upload
      // In a real implementation, you'd upload the file and get a URL
      const fileMessage = `[Uploaded: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]`;
      setMessage(prev => prev + (prev ? ' ' : '') + fileMessage);
    }
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleVoiceRecord = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsRecording(true);
        // For now, just simulate recording for 2 seconds
        setTimeout(() => {
          setIsRecording(false);
          stream.getTracks().forEach(track => track.stop());
          // Add a placeholder message for voice input
          setMessage(prev => prev + (prev ? ' ' : '') + '[Voice message recorded]');
        }, 2000);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        setIsRecording(false);
      }
    } else {
      setIsRecording(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    // Focus back to textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleQuickConnectionToggle = async () => {
    if (connectionState.connected) {
      await disconnect();
    } else {
      // Try to connect to the last known server or default
      const serverUrl = connectionState.serverUrl || 'http://localhost:8080';
      await connect(serverUrl);
    }
  };

  // Auto-focus on mount
  useEffect(() => {
    if (textareaRef.current && connectionState.connected) {
      textareaRef.current.focus();
    }
  }, [connectionState.connected]);

  const canSend = message.trim() && !isStreaming && connectionState.connected;

  return (
    <div className="p-6" style={{backgroundColor: 'lab(2.75381% 0 0)'}}>
      <div className="max-w-2xl mx-auto">
        <div className="relative group">
          <div className="flex items-center gap-2 border rounded-xl px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all duration-200" style={{backgroundColor: 'lab(2.75381% 0 0)'}}>
            {/* Left side - Attach button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!connectionState.connected || isStreaming}
              onClick={handleFileUpload}
              className="h-8 w-8 p-0 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              title="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            
            {/* Textarea */}
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                connectionState.connected
                  ? "Message OpenChat..."
                  : "Connect to a server first..."
              }
              disabled={!connectionState.connected || isStreaming}
              className="min-h-[24px] max-h-[200px] resize-none border-0 py-1 px-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none flex-1 text-foreground placeholder:text-muted-foreground leading-6" style={{backgroundColor: 'lab(2.75381% 0 0)'}}
              rows={1}
            />
            
            {/* Right side buttons */}
            <div className="flex items-center gap-1">
              {/* Voice/Emoji buttons - only show when not streaming */}
              {!isStreaming && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={!connectionState.connected || isStreaming}
                    onClick={handleVoiceRecord}
                    className={`h-8 w-8 p-0 rounded-lg hover:bg-muted transition-colors ${
                      isRecording ? 'text-red-500' : ''
                    }`}
                    title={isRecording ? 'Stop recording' : 'Start voice recording'}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={!connectionState.connected || isStreaming}
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="h-8 w-8 p-0 rounded-lg hover:bg-muted transition-colors relative"
                    title="Add emoji"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              {/* Send/Stop button */}
              <Button
                onClick={isStreaming ? stopStreaming : handleSend}
                disabled={!canSend && !isStreaming}
                size="sm"
                className={`h-8 w-8 p-0 rounded-lg transition-all duration-200 ${
                  canSend || isStreaming
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
                title={isStreaming ? 'Stop generation' : 'Send message'}
              >
                {isStreaming ? (
                  <Square className="h-4 w-4" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-full left-0 mb-2 bg-background border rounded-lg shadow-lg p-3 z-50 w-80">
              <div className="grid grid-cols-8 gap-1 max-h-60 overflow-y-auto">
                {['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '❤', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '👍', '👎', '👌', '✌', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝', '✋', '🤚', '🖐', '🖖', '👋', '💪', '🙏'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiSelect(emoji)}
                    className="text-lg hover:bg-muted p-1 rounded transition-colors"
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,.pdf,.txt,.doc,.docx"
        />
        
        
      </div>
    </div>
  );
};