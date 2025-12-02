'use client';

import { useChatStore } from '@/stores/chat-store';
import { ConnectionSettings } from './connection-settings';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function ConnectionDialog() {
  const { connectionDialogOpen, setConnectionDialogOpen } = useChatStore();
  
  return (
    <Dialog open={connectionDialogOpen} onOpenChange={setConnectionDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Connection Settings</DialogTitle>
          <DialogDescription>
            Configure your LLaMA.cpp server connection and manage server history
          </DialogDescription>
        </DialogHeader>
        
        <ConnectionSettings showTitle={false} compact={false} />
      </DialogContent>
    </Dialog>
  );
}