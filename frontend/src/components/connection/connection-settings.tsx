'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useChatStore } from '@/stores/chat-store';
import { useWebSocket } from '@/hooks/use-websocket';
import { Wifi, WifiOff, Loader2, History, X, Plus } from 'lucide-react';

interface ConnectionSettingsProps {
  showTitle?: boolean;
  compact?: boolean;
}

export const ConnectionSettings: React.FC<ConnectionSettingsProps> = ({ 
  showTitle = true, 
  compact = false 
}) => {
  const [serverUrl, setServerUrl] = useState('');
  const { connect, disconnect, isConnecting, connectionState } = useWebSocket();
  const { 
    serverHistory, 
    addToServerHistory, 
    removeFromServerHistory, 
    clearServerHistory 
  } = useChatStore();

  // Initialize server URL from current connection or first history item
  useEffect(() => {
    if (connectionState.serverUrl) {
      setServerUrl(connectionState.serverUrl);
    } else if (serverHistory.length > 0 && !serverUrl) {
      setServerUrl(serverHistory[0]);
    } else if (!serverUrl) {
      setServerUrl('http://localhost:8080');
    }
  }, [connectionState.serverUrl, serverHistory, serverUrl]);

  const handleConnect = async () => {
    if (!serverUrl.trim()) return;
    
    await connect(serverUrl.trim());
    addToServerHistory(serverUrl.trim());
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  const handleHistoryClick = (url: string) => {
    setServerUrl(url);
  };

  const handleRemoveFromHistory = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    removeFromServerHistory(url);
  };

  const handleQuickConnect = (url: string) => {
    setServerUrl(url);
    connect(url);
    addToServerHistory(url);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          connectionState.connected ? 'bg-green-500' : 'bg-red-500'
        }`} />
        <span className="text-sm text-muted-foreground">
          {connectionState.connected ? 'Connected' : 'Disconnected'}
        </span>
        <Button
          onClick={connectionState.connected ? handleDisconnect : handleConnect}
          disabled={isConnecting || !serverUrl.trim()}
          size="sm"
          variant={connectionState.connected ? "destructive" : "default"}
        >
          {isConnecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : connectionState.connected ? (
            <WifiOff className="w-4 h-4" />
          ) : (
            <Wifi className="w-4 h-4" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showTitle && (
        <div>
          <h3 className="font-semibold">Server Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Connect to a LLaMA.cpp server to start chatting
          </p>
        </div>
      )}

      {/* Server URL Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Server URL</label>
        <div className="flex gap-2">
          <Input
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="http://localhost:8080"
            disabled={connectionState.connected || isConnecting}
            className="flex-1"
          />
          <Button
            onClick={connectionState.connected ? handleDisconnect : handleConnect}
            disabled={isConnecting || !serverUrl.trim()}
            variant={connectionState.connected ? "destructive" : "default"}
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : connectionState.connected ? (
              <>
                <WifiOff className="w-4 h-4 mr-2" />
                Disconnect
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4 mr-2" />
                Connect
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="flex items-center gap-2 text-sm">
        <div className={`w-2 h-2 rounded-full ${
          connectionState.connected ? 'bg-green-500' : 'bg-red-500'
        }`} />
        <span className="text-muted-foreground">
          {connectionState.connected 
            ? `Connected to ${connectionState.serverUrl}` 
            : 'Disconnected'
          }
        </span>
        {connectionState.model && (
          <span className="text-muted-foreground">
            • Model: {connectionState.model}
          </span>
        )}
      </div>

      {/* Server History */}
      {serverHistory.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              <History className="w-4 h-4" />
              Recent Servers
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearServerHistory}
              className="h-6 px-2 text-xs"
            >
              Clear All
            </Button>
          </div>
          <div className="space-y-1">
            {serverHistory.map((url) => (
              <Card
                key={url}
                className="p-2 flex items-center justify-between group hover:bg-muted/50 cursor-pointer"
                onClick={() => handleHistoryClick(url)}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{url}</div>
                  <div className="text-xs text-muted-foreground">
                    {connectionState.serverUrl === url && connectionState.connected 
                      ? 'Currently connected' 
                      : 'Click to select'
                    }
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!connectionState.connected && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickConnect(url);
                      }}
                      className="h-6 w-6 p-0"
                      title="Quick connect"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleRemoveFromHistory(e, url)}
                    className="h-6 w-6 p-0"
                    title="Remove from history"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};