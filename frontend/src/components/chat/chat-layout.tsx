'use client';

import React, { useEffect } from 'react';
import { Sidebar } from '@/components/sidebar/sidebar';
import { SettingsDialog } from '@/components/settings/settings-dialog';
import { ConnectionDialog } from '@/components/connection';
import { useChatStore } from '@/stores/chat-store';
import { useWebSocket } from '@/hooks/use-websocket';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Settings, Moon, Sun, Menu, Wifi, WifiOff, Loader2 } from 'lucide-react';

interface ChatLayoutProps {
  children: React.ReactNode;
}



export const ChatLayout: React.FC<ChatLayoutProps> = ({ children }) => {
  const { 
    sidebarOpen, 
    sidebarCollapsed,
    mobileSidebarOpen,
    setSidebarOpen,
    setMobileSidebarOpen,
    toggleSidebarCollapsed,
    setSettingsOpen,
    setConnectionDialogOpen,
    theme, 
    updateTheme 
  } = useChatStore();

  // Debug sidebar states
  console.log('Sidebar states:', { sidebarCollapsed, sidebarOpen, mobileSidebarOpen });
  
  const { connect, disconnect, isConnecting, connectionState } = useWebSocket();
  


  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme.mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme.mode]);

  const toggleTheme = () => {
    updateTheme({
      mode: theme.mode === 'light' ? 'dark' : 'light'
    });
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

return (
    <div className="flex h-screen bg-background text-foreground relative">
      {/* Desktop Sidebar */}
      <div className={`hidden md:block transition-all duration-200 ease-out w-0`}>
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all ${
        sidebarCollapsed ? 'duration-150 ease-out' : 'duration-200 ease-out'
      } ${
        sidebarCollapsed ? 'ml-0' : 'ml-80'
      }`}>
        {/* Header */}
        <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              {/* Desktop Hamburger Menu */}
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:flex"
                onClick={toggleSidebarCollapsed}
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <Menu className="h-4 w-4" />
              </Button>
              <h1 className="text-xl font-semibold">OpenChat</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleQuickConnectionToggle}
                disabled={isConnecting}
                title={connectionState.connected ? 'Disconnect' : 'Connect'}
                className={connectionState.connected ? 'text-green-600' : 'text-red-600'}
              >
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : connectionState.connected ? (
                  <Wifi className="h-4 w-4" />
                ) : (
                  <WifiOff className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setConnectionDialogOpen(true);
                }}
                title="Connection Settings"
              >
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${
                    connectionState.connected ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-xs">Connection</span>
                </div>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
              >
                {theme.mode === 'light' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log('Settings button clicked');
                  setSettingsOpen(true);
                }}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>
        

        {/* Chat Content */}
        {children}
      </div>

      {/* Settings Dialog */}
      <SettingsDialog />
      
      {/* Connection Dialog */}
      <ConnectionDialog />
    </div>
  );
};