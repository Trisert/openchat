'use client';

import { useChatStore } from '@/stores/chat-store';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConnectionSettings } from '@/components/connection';

export function SettingsDialog() {
  const { settingsOpen, setSettingsOpen, chatSettings, updateChatSettings, theme, updateTheme } = useChatStore();
  
  return (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your chat preferences and appearance
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chat">Chat Settings</TabsTrigger>
            <TabsTrigger value="connection">Connection</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Temperature</label>
              <Slider
                value={[chatSettings.temperature]}
                onValueChange={([value]) => updateChatSettings({ temperature: value })}
                max={2}
                min={0}
                step={0.1}
                className="w-full"
              />
              <span className="text-sm text-muted-foreground">{chatSettings.temperature}</span>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Tokens</label>
              <Slider
                value={[chatSettings.max_tokens]}
                onValueChange={([value]) => updateChatSettings({ max_tokens: value })}
                max={4096}
                min={128}
                step={128}
                className="w-full"
              />
              <span className="text-sm text-muted-foreground">{chatSettings.max_tokens}</span>
            </div>
            
             <div className="space-y-2">
               <label className="text-sm font-medium">Top P</label>
               <Slider
                 value={[chatSettings.top_p]}
                 onValueChange={([value]) => updateChatSettings({ top_p: value })}
                 max={1}
                 min={0}
                 step={0.05}
                 className="w-full"
               />
               <span className="text-sm text-muted-foreground">{chatSettings.top_p}</span>
             </div>

             <div className="space-y-2">
               <div className="flex items-center justify-between">
                 <div>
                   <label className="text-sm font-medium">Web Search</label>
                   <p className="text-xs text-muted-foreground">Allow AI to search the web for current information</p>
                 </div>
                 <Switch
                   checked={chatSettings.webSearchEnabled}
                   onCheckedChange={(checked) => updateChatSettings({ webSearchEnabled: checked })}
                 />
               </div>
             </div>
           </TabsContent>
          
          <TabsContent value="appearance" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Dark Mode</label>
                <Switch
                  checked={theme.mode === 'dark'}
                  onCheckedChange={(checked) => updateTheme({ mode: checked ? 'dark' : 'light' })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Animations</label>
                <Switch
                  checked={theme.animations}
                  onCheckedChange={(checked) => updateTheme({ animations: checked })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Compact Mode</label>
                <Switch
                  checked={theme.compactMode}
                  onCheckedChange={(checked) => updateTheme({ compactMode: checked })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Font Size</label>
              <Slider
                value={[theme.fontSize]}
                onValueChange={([value]) => updateTheme({ fontSize: value })}
                max={20}
                min={12}
                step={1}
                className="w-full"
              />
              <span className="text-sm text-muted-foreground">{theme.fontSize}px</span>
            </div>
          </TabsContent>
          
          <TabsContent value="connection" className="space-y-4">
            <ConnectionSettings showTitle={false} compact={false} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}