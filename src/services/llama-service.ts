import { LlamaMessage, ChatOptions, CompletionRequest } from "../types/chat"
import { ChatTemplateManager } from "./chat-template-manager";
import { WebSearchService } from "./web-search-service";

export class LlamaService {
  private serverUrl: string = '';
  private model: string = '';
  private isConnected: boolean = false;
  private webSearchService: WebSearchService | null = null;

  setWebSearchService(service: WebSearchService): void {
    this.webSearchService = service;
  }

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

  async sendMessage(message: string, options: ChatOptions = {}, enableWebSearch: boolean = false): Promise<AsyncIterable<string>> {
    if (!this.isConnected || !this.serverUrl) {
      throw new Error('Not connected to server');
    }

    // Build conversation with tool calling instructions if web search is enabled
    const systemPrompt = enableWebSearch ? this.getSystemPromptWithTools() : '';
    const conversation: LlamaMessage[] = [];

    if (systemPrompt) {
      conversation.push({ role: 'system', content: systemPrompt });
    }

    conversation.push({ role: 'user', content: message });

    // Handle tool calling loop
    let maxToolCalls = 3; // Prevent infinite loops
    let toolCallCount = 0;

    while (toolCallCount < maxToolCalls) {
      const templateType = ChatTemplateManager.detectTemplateType(this.model);
      const prompt = ChatTemplateManager.formatMessages(conversation, templateType);

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
      console.log('Conversation length:', conversation.length);

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

      // Collect the full response to check for tool calls
      let fullResponse = '';
      const chunks: string[] = [];

      for await (const chunk of this.parseStream(response.body)) {
        fullResponse += chunk;
        chunks.push(chunk);
      }

      // Check if the response contains a tool call
      const toolCall = this.extractToolCall(fullResponse);
      if (toolCall && enableWebSearch) {
        toolCallCount++;
        console.log('Detected tool call:', toolCall);

        // Execute the tool
        const toolResult = await this.executeTool(toolCall);

        // Add the tool result to the conversation
        conversation.push({
          role: 'assistant',
          content: fullResponse
        });

        conversation.push({
          role: 'user',
          content: `Tool result: ${toolResult}`
        });

        // Continue the loop for another AI response
        continue;
      } else {
        // No tool call or web search disabled, return the response
        return this.createAsyncIterable(chunks);
      }
    }

    // If we exit the loop, return the last response
    return this.createAsyncIterable([]);
  }

  private getSystemPromptWithTools(): string {
    const modelName = this.model.toLowerCase();

    if (modelName.includes('qwen')) {
      return `You are a helpful AI assistant with access to web search tools.

When you need current information, up-to-date data, or to verify facts, you can use the web_search tool.

To use a tool, respond with the following format:
<tool_call>
{"name": "web_search", "arguments": {"query": "your search query here"}}
</tool_call>

After receiving tool results, continue your response naturally incorporating the information.

Available tools:
- web_search: Search the web for current information
  Parameters: {"query": "search query string"}`;
    }

    // Default format for other models (LLaMA, etc.)
    return `You are a helpful AI assistant with access to web search tools.

When you need current information, up-to-date data, or to verify facts, you can use the web_search tool.

To use a tool, respond with the following format:
TOOL_CALL: web_search
QUERY: [your search query here]

After receiving tool results, continue your response naturally incorporating the information.

Available tools:
- web_search: Search the web for current information
  Format: TOOL_CALL: web_search
          QUERY: [search query]`;
  }

  private extractToolCall(response: string): { tool: string; query: string } | null {
    const modelName = this.model.toLowerCase();

    // Qwen format: <tool_call>{"name": "web_search", "arguments": {"query": "..."}}</tool_call>
    if (modelName.includes('qwen')) {
      const qwenMatch = response.match(/<tool_call>\s*(\{[^}]+\})\s*<\/tool_call>/i);
      if (qwenMatch) {
        try {
          const toolCall = JSON.parse(qwenMatch[1]);
          if (toolCall.name === 'web_search' && toolCall.arguments?.query) {
            return {
              tool: toolCall.name,
              query: toolCall.arguments.query
            };
          }
        } catch (e) {
          console.error('Failed to parse Qwen tool call:', e);
        }
      }
    }

    // Default format: TOOL_CALL: web_search QUERY: [query]
    const defaultMatch = response.match(/TOOL_CALL:\s*(\w+)\s*QUERY:\s*(.+)/i);
    if (defaultMatch) {
      return {
        tool: defaultMatch[1].toLowerCase(),
        query: defaultMatch[2].trim()
      };
    }

    return null;
  }

  private async executeTool(toolCall: { tool: string; query: string }): Promise<string> {
    if (toolCall.tool === 'web_search' && this.webSearchService) {
      console.log('Executing web search for:', toolCall.query);
      const results = await this.webSearchService.search(toolCall.query);
      const formattedResults = this.webSearchService.formatResultsForAI(results);
      return formattedResults;
    }

    return 'Tool not available or not recognized.';
  }

  private async *createAsyncIterable(chunks: string[]): AsyncIterable<string> {
    for (const chunk of chunks) {
      yield chunk;
    }
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
