import { Elysia } from 'elysia';
import { LlamaService } from '../services/llama-service';

const llamaService = new LlamaService();

export const modelRoutes = new Elysia({ prefix: '/api' })
  .get('/health', async ({ query }) => {
    try {
      const { serverUrl } = query;
      
      if (!serverUrl) {
        return {
          success: false,
          error: 'Server URL is required'
        };
      }

      const isHealthy = await llamaService.checkServerHealth(serverUrl as string);
      
      return {
        success: true,
        healthy: isHealthy
      };
    } catch (error) {
      console.error('Health check error:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });