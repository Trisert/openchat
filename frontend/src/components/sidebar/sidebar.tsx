'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useChatStore } from '@/stores/chat-store';
import { Plus, Search, Trash2, Download, MoreHorizontal, MessageSquare, Settings, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export const Sidebar: React.FC = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const {
    conversations,
    currentConversationId,
    sidebarCollapsed,
    createConversation,
    switchConversation,
    deleteConversation,
    clearMessages
  } = useChatStore();

  const handleNewChat = () => {
    const id = createConversation();
    switchConversation(id);
  };

  const handleExportChat = () => {
    const currentConversation = conversations.find(conv => conv.id === currentConversationId);
    if (!currentConversation) return;

    // Create export content
    const exportContent = {
      title: currentConversation.title,
      createdAt: currentConversation.createdAt,
      updatedAt: currentConversation.updatedAt,
      messages: currentConversation.messages,
      exportedAt: new Date().toISOString()
    };

    // Convert to JSON string
    const jsonString = JSON.stringify(exportContent, null, 2);

    // Create blob and download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-export-${currentConversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Note: sidebarOpen is only used for mobile sidebar controlled by Sheet component

  // If sidebar is collapsed, don't render anything (completely hidden)
  if (sidebarCollapsed) {
    return null;
  }

  // Expanded sidebar
  return (
    <div className="w-80 border-r bg-background flex flex-col h-full transition-all duration-150 ease-out">
      {/* Chat History */}
      <div className="flex-1 flex flex-col p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Chat History</h3>
          <Button onClick={handleNewChat} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            New Chat
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="pl-10"
          />
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {searchQuery
                ? (conversations.length === 0 ? 'No conversations yet' : 'No matching conversations found')
                : 'No conversations yet'
              }
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <Card
                key={conv.id}
                className={`p-3 cursor-pointer transition-colors hover:bg-muted/50 group ${
                  currentConversationId === conv.id ? 'bg-muted border-primary' : ''
                }`}
                onClick={() => switchConversation(conv.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-2">
                    <h4 className="font-medium truncate">{conv.title}</h4>
                    <div className="text-xs text-muted-foreground mt-1">
                      {conv.messages.length} messages • {new Date(conv.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Chat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="mt-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
              >
                <MoreHorizontal className="w-4 h-4 mr-2" />
                Chat Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={clearMessages}
                disabled={!currentConversationId}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Messages
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleExportChat}
                disabled={conversations.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};