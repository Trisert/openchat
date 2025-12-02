import { LlamaMessage } from '../types/chat';

export class ChatTemplateManager {
  private static templates: Record<string, (messages: LlamaMessage[]) => string> = {
    'llama3': ChatTemplateManager.llama3Template,
    'chatml': ChatTemplateManager.chatmlTemplate,
    'mistral': ChatTemplateManager.mistralTemplate,
    'vicuna': ChatTemplateManager.vicunaTemplate,
    'gemma': ChatTemplateManager.gemmaTemplate,
    'deepseek': ChatTemplateManager.deepseekTemplate,
    'command-r': ChatTemplateManager.commandRTemplate,
    'zephyr': ChatTemplateManager.zephyrTemplate,
    'monarch': ChatTemplateManager.monarchTemplate,
    'openchat': ChatTemplateManager.openchatTemplate,
  };

  static formatMessages(messages: LlamaMessage[], templateType: string = 'chatml'): string {
    const formatter = this.templates[templateType] || this.templates['chatml'];
    return formatter(messages);
  }

  static detectTemplateType(modelName: string): string {
    const name = modelName.toLowerCase();
    
    if (name.includes('llama-3') || name.includes('llama3')) return 'llama3';
    if (name.includes('mistral')) return 'mistral';
    if (name.includes('vicuna')) return 'vicuna';
    if (name.includes('gemma')) return 'gemma';
    if (name.includes('deepseek')) return 'deepseek';
    if (name.includes('command-r')) return 'command-r';
    if (name.includes('zephyr')) return 'zephyr';
    if (name.includes('monarch')) return 'monarch';
    if (name.includes('openchat')) return 'openchat';
    
    return 'chatml'; // Default fallback
  }

  private static llama3Template(messages: LlamaMessage[]): string {
    let result = '';
    
    for (const message of messages) {
      result += `<|start_header_id|>${message.role}<|end_header_id|>\n\n${message.content.trim()}<|eot_id|>\n`;
    }
    
    result += '<|start_header_id|>assistant<|end_header_id|>\n\n';
    return result;
  }

  private static chatmlTemplate(messages: LlamaMessage[]): string {
    let result = '';
    
    for (const message of messages) {
      result += `<|im_start|>${message.role}\n${message.content.trim()}<|im_end|>\n`;
    }
    
    result += '<|im_start|>assistant\n';
    return result;
  }

  private static mistralTemplate(messages: LlamaMessage[]): string {
    let result = '<s>';
    
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      if (message.role === 'system') {
        result += `[INST] ${message.content} [/INST] `;
      } else if (message.role === 'user') {
        result += `[INST] ${message.content} [/INST] `;
      } else if (message.role === 'assistant') {
        result += `${message.content}</s>`;
        if (i < messages.length - 1) {
          result += '<s>';
        }
      }
    }
    
    return result;
  }

  private static vicunaTemplate(messages: LlamaMessage[]): string {
    let result = '';
    
    // Add system message if present
    const systemMessage = messages.find(m => m.role === 'system');
    if (systemMessage) {
      result += `${systemMessage.content}\n\n`;
    }
    
    for (const message of messages) {
      if (message.role === 'user') {
        result += `USER: ${message.content}\n`;
      } else if (message.role === 'assistant') {
        result += `ASSISTANT: ${message.content}</s>\n`;
      }
    }
    
    result += 'ASSISTANT: ';
    return result;
  }

  private static gemmaTemplate(messages: LlamaMessage[]): string {
    let result = '';
    
    for (const message of messages) {
      if (message.role === 'system') {
        continue; // Gemma doesn't support system messages
      }
      
      const role = message.role === 'user' ? 'user' : 'model';
      result += `<start_of_turn>${role}\n${message.content.trim()}<end_of_turn>\n`;
    }
    
    result += '<start_of_turn>model\n';
    return result;
  }

  private static deepseekTemplate(messages: LlamaMessage[]): string {
    let result = '';
    
    // Add system message if present
    const systemMessage = messages.find(m => m.role === 'system');
    if (systemMessage) {
      result += `${systemMessage.content}\n\n`;
    }
    
    for (const message of messages) {
      if (message.role === 'user') {
        result += `### Instruction:\n${message.content}\n`;
      } else if (message.role === 'assistant') {
        result += `### Response:\n${message.content}<|EOT|>\n`;
      }
    }
    
    result += '### Response:\n';
    return result;
  }

  private static commandRTemplate(messages: LlamaMessage[]): string {
    let result = '';
    
    for (const message of messages) {
      if (message.role === 'system') {
        result += `<|START_OF_TURN_TOKEN|><|SYSTEM_TOKEN|>${message.content}<|END_OF_TURN_TOKEN|>`;
      } else if (message.role === 'user') {
        result += `<|START_OF_TURN_TOKEN|><|USER_TOKEN|>${message.content}<|END_OF_TURN_TOKEN|>`;
      } else if (message.role === 'assistant') {
        result += `<|START_OF_TURN_TOKEN|><|CHATBOT_TOKEN|>${message.content}<|END_OF_TURN_TOKEN|>`;
      }
    }
    
    result += '<|START_OF_TURN_TOKEN|><|CHATBOT_TOKEN|>';
    return result;
  }

  private static zephyrTemplate(messages: LlamaMessage[]): string {
    let result = '';
    
    for (const message of messages) {
      if (message.role === 'system') {
        result += `<|system|>\n${message.content}\n`;
      } else if (message.role === 'user') {
        result += `<|user|>\n${message.content}\n`;
      } else if (message.role === 'assistant') {
        result += `<|assistant|>\n${message.content}\n`;
      }
    }
    
    result += '<|assistant|>\n';
    return result;
  }

  private static monarchTemplate(messages: LlamaMessage[]): string {
    let result = '';
    
    for (const message of messages) {
      result += `<s>${message.role}\n${message.content.trim()}</s>\n`;
    }
    
    result += '<s>assistant\n';
    return result;
  }

  private static openchatTemplate(messages: LlamaMessage[]): string {
    let result = '';
    
    for (const message of messages) {
      if (message.role === 'system') {
        result += `GPT4 Correct System: ${message.content}<|end_of_turn|>`;
      } else if (message.role === 'user') {
        result += `GPT4 Correct User: ${message.content}<|end_of_turn|>`;
      } else if (message.role === 'assistant') {
        result += `GPT4 Correct Assistant: ${message.content}<|end_of_turn|>`;
      }
    }
    
    result += 'GPT4 Correct Assistant: ';
    return result;
  }
}