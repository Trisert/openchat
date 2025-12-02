'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Message } from '@/types/chat';
import { Bot, User, Loader2 } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;

  return (
    <div
      className={cn(
        'flex gap-3 p-4 w-full',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary" />
        </div>
      )}
      
      <Card
        className={cn(
          'max-w-[70%] p-3 shadow-sm',
          isUser
            ? 'bg-primary text-primary-foreground ml-auto'
            : 'bg-muted',
          isStreaming && 'border-primary/50'
        )}
      >
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            {isUser ? (
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
            ) : (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown
                  key={message.content + (message.isStreaming ? '-streaming' : '')}
                  components={{
                    p: (props: any) => (
                      <p className="text-sm whitespace-pre-wrap break-words mb-2 last:mb-0" {...props}>
                        {props.children}
                      </p>
                    ),
                    code: (props: any) => {
                      const isInline = !props.className || !props.className.startsWith('language-');
                      if (isInline) {
                        return (
                          <code className="px-1 py-0.5 bg-muted-foreground/20 rounded text-xs font-mono" {...props}>
                            {props.children}
                          </code>
                        );
                      }
                      return (
                        <pre className="bg-muted p-2 rounded-md overflow-x-auto">
                          <code {...props}>
                            {props.children}
                          </code>
                        </pre>
                      );
                    },
                    ul: (props: any) => (
                      <ul className="list-disc list-inside text-sm mb-2" {...props}>
                        {props.children}
                      </ul>
                    ),
                    ol: (props: any) => (
                      <ol className="list-decimal list-inside text-sm mb-2" {...props}>
                        {props.children}
                      </ol>
                    ),
                    li: (props: any) => (
                      <li className="mb-1" {...props}>
                        {props.children}
                      </li>
                    ),
                    strong: (props: any) => (
                      <strong className="font-semibold" {...props}>
                        {props.children}
                      </strong>
                    ),
                    em: (props: any) => (
                      <em className="italic" {...props}>
                        {props.children}
                      </em>
                    ),
                    blockquote: (props: any) => (
                      <blockquote className="border-l-4 border-primary/30 pl-3 text-sm italic" {...props}>
                        {props.children}
                      </blockquote>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
            
            {isStreaming && (
              <div className="flex items-center gap-1 mt-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-xs text-muted-foreground">AI is typing...</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <User className="w-5 h-5 text-primary-foreground" />
        </div>
      )}
    </div>
  );
};