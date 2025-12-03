'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Message } from '@/types/chat';
import { Bot, User, Loader2, Copy, Check, Globe } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = async (text: string, codeId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(codeId);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div
      className={cn(
        'flex gap-3 p-4 w-full group',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          {message.webSearchUsed && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Globe className="w-3 h-3" />
              <span>Web</span>
            </div>
          )}
        </div>
      )}

      {/* For user messages, group the copy button and bubble together */}
      {isUser ? (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-xs opacity-0 group-hover:opacity-100 transition-opacity rounded flex-shrink-0"
            onClick={() => copyToClipboard(message.content, `${message.role}-${message.id}`)}
            title="Copy message"
          >
            {copiedCode === `${message.role}-${message.id}` ? (
              <Check className="w-3 h-3" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </Button>

          <Card
            className={cn(
              'max-w-[70%] p-3 shadow-sm relative',
              'bg-primary text-primary-foreground',
              isStreaming && 'border-primary/50'
            )}
          >
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>

            {isStreaming && (
              <div className="flex items-center gap-1 mt-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-xs text-muted-foreground">AI is typing...</span>
              </div>
            )}
          </Card>
        </div>
      ) : (
        <>
          <Card
            className={cn(
              'max-w-[70%] p-3 shadow-sm relative',
              'bg-muted',
              isStreaming && 'border-primary/50'
            )}
          >
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

                    const language = props.className?.replace('language-', '') || '';
                    const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;
                    const codeContent = props.children;

                    return (
                      <div className="relative group">
                        <div className="flex items-center justify-between bg-muted border-b border-border px-4 py-2 text-xs text-muted-foreground rounded-t-md">
                          <span className="font-medium">{language || 'plaintext'}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => copyToClipboard(String(codeContent), codeId)}
                          >
                            {copiedCode === codeId ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                        <pre className="bg-muted p-4 rounded-b-md overflow-x-auto text-sm">
                          <code
                            className={`font-mono ${language ? `language-${language}` : ''}`}
                            {...props}
                          >
                            {codeContent}
                          </code>
                        </pre>
                      </div>
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

            {isStreaming && (
              <div className="flex items-center gap-1 mt-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-xs text-muted-foreground">AI is typing...</span>
              </div>
            )}
          </Card>

          {/* Copy button for assistant messages - positioned after the bubble */}
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-xs opacity-0 group-hover:opacity-100 transition-opacity rounded flex-shrink-0"
            onClick={() => copyToClipboard(message.content, `${message.role}-${message.id}`)}
            title="Copy message"
          >
            {copiedCode === `${message.role}-${message.id}` ? (
              <Check className="w-3 h-3" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </Button>
        </>
      )}

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <User className="w-5 h-5 text-primary-foreground" />
        </div>
      )}
    </div>
  );
};