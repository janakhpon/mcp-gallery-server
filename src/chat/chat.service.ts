import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';
import { MCPRequest, ChatResponse } from './dto/chat.dto';
import { ImagesService } from '../images/images.service';

@Injectable()
export class ChatService implements OnModuleInit {
  private readonly logger = new Logger(ChatService.name);
  private openai: OpenAI;
  private chatHistory: ChatCompletionMessageParam[] = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly imagesService: ImagesService,
  ) { }

  onModuleInit() {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      this.logger.warn(
        'OPENAI_API_KEY not found. Chat assistant will be limited.',
      );
    }
  }

  async processMessage(request: MCPRequest): Promise<ChatResponse> {
    this.logger.log(`Processing message: ${request.message}`);

    if (!this.openai) {
      return {
        content: 'Assistant is not configured. Please add OPENAI_API_KEY.',
        metadata: { action: 'error', error: 'Missing configuration' },
      };
    }

    try {
      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content:
            'You are a minimalist Gallery Assistant. Help users list, search, view, and manage images. You can also handle image uploads. When a user attaches a file, the system will process the upload and inform you. Your role is to acknowledge the upload and provide a friendly confirmation. Keep responses concise and professional. Do not use emojis.',
        },
        ...this.chatHistory.slice(-10),
        { role: 'user', content: request.message },
      ];

      const model =
        this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';

      const tools: ChatCompletionTool[] = [
        {
          type: 'function',
          function: {
            name: 'upload_image',
            description: 'Upload an image to the gallery',
            parameters: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Optional title' },
                description: {
                  type: 'string',
                  description: 'Optional description',
                },
              },
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'list_images',
            description: 'List all images in the gallery with pagination',
            parameters: {
              type: 'object',
              properties: {
                page: { type: 'number', default: 1 },
                limit: { type: 'number', default: 10 },
              },
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'search_images',
            description: 'Search for images by query',
            parameters: {
              type: 'object',
              properties: {
                query: { type: 'string' },
                limit: { type: 'number', default: 10 },
              },
              required: ['query'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'delete_image',
            description: 'Delete an image by ID',
            parameters: {
              type: 'object',
              properties: {
                id: { type: 'string' },
              },
              required: ['id'],
            },
          },
        },
      ];

      const response = await this.openai.chat.completions.create({
        model: model,
        messages: messages,
        tools: tools,
      });

      const choice = response.choices[0];
      const message = choice.message;

      this.chatHistory.push({ role: 'user', content: request.message });

      if (message.tool_calls) {
        messages.push(message);

        for (const toolCall of message.tool_calls) {
          if (toolCall.type !== 'function') continue;
          const functionName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments) as {
            page?: number;
            limit?: number;
            query?: string;
            id?: string;
          };
          let toolResult: any;

          if (functionName === 'upload_image') {
            // Internal acknowledgment for the assistant that upload is being handled
            toolResult = {
              status: 'success',
              message: 'Ready to receive file',
            };
          } else if (functionName === 'list_images') {
            toolResult = await this.imagesService.findAll({
              page: args.page,
              limit: args.limit,
            });
          } else if (functionName === 'search_images') {
            toolResult = await this.imagesService.findAll({
              search: args.query,
              limit: args.limit,
            });
          } else if (functionName === 'delete_image' && args.id) {
            toolResult = await this.imagesService.remove(args.id);
          }

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult),
          } as ChatCompletionMessageParam);
        }

        const secondResponse = await this.openai.chat.completions.create({
          model: model,
          messages: messages,
        });

        const finalContent =
          secondResponse.choices[0].message.content || 'Request processed.';
        this.chatHistory.push({ role: 'assistant', content: finalContent });

        return {
          content: finalContent,
          metadata: { action: 'tool_call' },
        };
      }

      const content = message.content || 'I cannot process that request.';
      this.chatHistory.push({ role: 'assistant', content });

      return {
        content: content,
        metadata: { action: 'message' },
      };
    } catch (error: any) {
      this.logger.error('Error processing message:', error);

      const axiosError = error as {
        status?: number;
        code?: string;
        message?: string;
      };

      if (
        axiosError?.status === 401 ||
        axiosError?.code === 'invalid_api_key'
      ) {
        return {
          content:
            'Invalid OpenAI API key. Please check your .env configuration.',
          metadata: { action: 'error', error: 'Authentication failed' },
        };
      }

      const errorMessage = axiosError?.message || 'Unknown error';
      return {
        content: 'Failed to process request.',
        metadata: { action: 'error', error: errorMessage },
      };
    }
  }

  async getHistory(limit: number = 50): Promise<ChatResponse[]> {
    const history = this.chatHistory
      .filter(
        (h) =>
          h.role !== 'tool' && 'content' in h && typeof h.content === 'string',
      )
      .slice(-limit)
      .map((h) => {
        const msg = h as { content: string; role: string };
        return {
          content: msg.content,
          metadata: { role: msg.role },
        };
      });
    return Promise.resolve(history);
  }
}
