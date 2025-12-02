import { ChatLayout } from '@/components/chat/chat-layout';
import { MessageList } from '@/components/chat/message-list';
import { MessageInput } from '@/components/chat/message-input';

export default function ChatPage() {
  return (
    <ChatLayout>
      <MessageList />
      <MessageInput />
    </ChatLayout>
  );
}
