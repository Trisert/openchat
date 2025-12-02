import { LlamaMessage, ChatOptions, CompletionRequest } from "../types/chat"
import { ChatTemplateManager } from "./chat-template-manager";

export class LlamaService {
  private serverUrl: string = '';
  private model: string = '';
  private isConnected: boolean = false;

  async connect(serverUrl: string, model: string = 'default'): Promise<boolean> {
    try {
      this.serverUrl = serverUrl;
      this.model = model;

      // Test connection with a health check
      const response = await fetch(`${serverUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        this.isConnected = true;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Connection failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.serverUrl = '';
    this.model = '';
  }

  async checkServerHealth(serverUrl: string): Promise<boolean> {
    try {
      const response = await fetch(`${serverUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000)
      });

      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  async sendMessage(message: string, options: ChatOptions = {}): Promise<AsyncIterable<string>> {
    if (!this.isConnected || !this.serverUrl) {
      throw new Error('Not connected to server');
    }

    const messages: LlamaMessage[] = [
      { role: 'user', content: message }
    ];

    const templateType = ChatTemplateManager.detectTemplateType(this.model);
    const prompt = ChatTemplateManager.formatMessages(messages, templateType);

    const requestBody: CompletionRequest = {
      prompt,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 2048,
      top_p: options.top_p || 0.9,
      top_k: options.top_k,
      repeat_penalty: options.repeat_penalty,
      seed: options.seed,
      stop: options.stop,
      stream: true
    };

    console.log('Sending request to:', `${this.serverUrl}/completion`);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${this.serverUrl}/completion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(60000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HTTP error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    return this.parseStream(response.body);
  }

  private async *parseStream(body: ReadableStream): AsyncIterable<string> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            console.debug('Received line:', line);
            try {
              // Handle both "data: {json}" and plain JSON formats
              let jsonStr = line;
              if (line.startsWith('data: ')) {
                jsonStr = line.slice(6);
              }
              
              const data = JSON.parse(jsonStr);
              console.debug('Parsed data:', data);
              
              // LLaMA.cpp streaming response format
              if (data.content) {
                console.debug('Yielding content:', data.content);
                yield data.content;
              } else if (data.choices && data.choices[0]?.delta?.content) {
                console.debug('Yielding delta content:', data.choices[0].delta.content);
                yield data.choices[0].delta.content;
              } else if (data.text) {
                console.debug('Yielding text:', data.text);
                yield data.text;
              }
            } catch (parseError) {
              console.debug('Failed to parse line:', line, parseError);
              // Skip invalid JSON lines
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  getConnectionStatus(): { connected: boolean; serverUrl: string; model: string } {
    return {
      connected: this.isConnected,
      serverUrl: this.serverUrl,
      model: this.model
    };
  }
}
