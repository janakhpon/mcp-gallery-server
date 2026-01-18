import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';
import {
  GoogleGenerativeAI,
  GenerativeModel,
  Content,
  SchemaType,
} from '@google/generative-ai';
import { MCPRequest, ChatResponse } from './dto/chat.dto';
import { ImagesService } from '../images/images.service';

@Injectable()
export class ChatService implements OnModuleInit {
  private readonly logger = new Logger(ChatService.name);
  private openai: OpenAI;
  private geminiModel: GenerativeModel;
  private chatHistory: ChatCompletionMessageParam[] = [];
  private provider: 'openai' | 'gemini' = 'openai';

  constructor(
    private readonly configService: ConfigService,
    private readonly imagesService: ImagesService,
  ) { }

  onModuleInit() {
    this.provider =
      this.configService.get<'openai' | 'gemini'>('AI_PROVIDER') || 'openai';
    this.logger.log(`Initializing ChatService with provider: ${this.provider}`);

    // Initialize OpenAI if configured
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    } else {
      this.logger.warn(
        'OPENAI_API_KEY not found. OpenAI features will be unavailable.',
      );
    }

    // Initialize Gemini if configured
    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (geminiKey) {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const modelName =
        this.configService.get<string>('GEMINI_MODEL') || 'gemini-2.0-flash';
      this.geminiModel = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction:
          `You are a minimalist Gallery Assistant powered by Google Gemini (${modelName}). Help users list, search, view, and manage images. You can also handle image uploads. When a user attaches a file, the system will process the upload and inform you. Your role is to acknowledge the upload and provide a friendly confirmation. Keep responses concise and professional. Do not use emojis.`,
      });
    } else {
      this.logger.warn(
        'GEMINI_API_KEY not found. Gemini features will be unavailable.',
      );
    }
  }

  async processMessage(request: MCPRequest): Promise<ChatResponse> {
    const provider = request.provider || this.provider;
    this.logger.log(
      `Processing message with ${provider}: ${request.message}`,
    );

    if (provider === 'gemini') {
      return this.processGeminiMessage(request);
    } else {
      return this.processOpenAIMessage(request);
    }
  }

  private async processGeminiMessage(
    request: MCPRequest,
  ): Promise<ChatResponse> {
    if (!this.geminiModel) {
      return {
        content: 'Gemini Assistant is not configured. Please add GEMINI_API_KEY.',
        metadata: { action: 'error', error: 'Missing configuration' },
      };
    }

    try {
      // Convert history to Gemini format
      const history: Content[] = this.chatHistory
        .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
        .map((msg) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content as string }],
        }));

      // Define tools for Gemini
      const toolsDefinition: any = {
        functionDeclarations: [
          {
            name: 'upload_image',
            description: 'Upload an image to the gallery',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                title: {
                  type: SchemaType.STRING,
                  description: 'Optional title',
                },
                description: {
                  type: SchemaType.STRING,
                  description: 'Optional description',
                },
              },
            },
          },
          {
            name: 'list_images',
            description: 'List all images in the gallery with pagination',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                page: {
                  type: SchemaType.NUMBER,
                  description: 'Page number, default 1',
                },
                limit: {
                  type: SchemaType.NUMBER,
                  description: 'Items per page, default 10',
                },
              },
            },
          },
          {
            name: 'search_images',
            description: 'Search for images by query',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                query: { type: SchemaType.STRING, description: 'Search query' },
                limit: {
                  type: SchemaType.NUMBER,
                  description: 'Limit results, default 10',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'delete_image',
            description: 'Delete an image by ID',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.STRING, description: 'Image ID' },
              },
              required: ['id'],
            },
          },
        ],
      };

      const modelWithTools = this.geminiModel.apiKey
        ? new GoogleGenerativeAI(this.geminiModel.apiKey).getGenerativeModel({
          model: this.geminiModel.model,
          systemInstruction:
            `You are a minimalist Gallery Assistant powered by Google Gemini (${this.geminiModel.model}). Help users list, search, view, and manage images. You can also handle image uploads. When a user attaches a file, the system will process the upload and inform you. Your role is to acknowledge the upload and provide a friendly confirmation. Keep responses concise and professional. Do not use emojis.`,
          tools: [toolsDefinition],
        })
        : this.geminiModel;

      const chat = modelWithTools.startChat({
        history: history,
      });

      const result = await chat.sendMessage(request.message);
      const response = result.response;
      const functionCalls = response.functionCalls();

      this.chatHistory.push({ role: 'user', content: request.message });

      if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
          const functionName = call.name;
          const args = call.args as any;
          let toolResult: any;

          if (functionName === 'upload_image') {
            toolResult = {
              status: 'success',
              message: 'Ready to receive file',
            };
          } else if (functionName === 'list_images') {
            toolResult = await this.imagesService.findAll({
              page: args.page || 1,
              limit: args.limit || 10,
            });
          } else if (functionName === 'search_images') {
            toolResult = await this.imagesService.findAll({
              search: args.query,
              limit: args.limit || 10,
            });
          } else if (functionName === 'delete_image' && args.id) {
            toolResult = await this.imagesService.remove(args.id);
          }

          // Send result back to model
          const currentResult = await chat.sendMessage([
            {
              functionResponse: {
                name: functionName,
                response: toolResult,
              },
            },
          ]);

          const finalText = currentResult.response.text();
          this.chatHistory.push({ role: 'assistant', content: finalText });

          return {
            content: finalText,
            metadata: { action: 'tool_call' },
          };
        }
      }

      const text = response.text();
      this.chatHistory.push({ role: 'assistant', content: text });

      return {
        content: text,
        metadata: { action: 'message' },
      };
    } catch (error: any) {
      this.logger.error('Error processing Gemini message:', error);
      return {
        content: 'Failed to process request with Gemini.',
        metadata: { action: 'error', error: error.message },
      };
    }
  }

  private async processOpenAIMessage(
    request: MCPRequest,
  ): Promise<ChatResponse> {
    if (!this.openai) {
      return {
        content: 'Assistant is not configured. Please add OPENAI_API_KEY.',
        metadata: { action: 'error', error: 'Missing configuration' },
      };
    }

    try {
      const model =
        this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';

      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content:
            `You are a minimalist Gallery Assistant powered by OpenAI (${model}). Help users list, search, view, and manage images. You can also handle image uploads. When a user attaches a file, the system will process the upload and inform you. Your role is to acknowledge the upload and provide a friendly confirmation. Keep responses concise and professional. Do not use emojis.`,
        },
        ...this.chatHistory.slice(-10),
        { role: 'user', content: request.message },
      ];


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
      this.logger.error('Error processing OpenAI message:', error);

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
