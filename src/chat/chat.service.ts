import { Injectable, Logger } from '@nestjs/common';
import { MCPRequest, ChatResponse } from './dto/chat.dto';
import { ImagesService } from '../images/images.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private chatHistory: ChatResponse[] = [];

  constructor(private readonly imagesService: ImagesService) {}

  async processMessage(request: MCPRequest): Promise<ChatResponse> {
    this.logger.log(`Processing message: ${request.message}`);

    try {
      const message = request.message.toLowerCase();
      let response: ChatResponse;

      if (message.includes('search') && message.split(' ').length > 1) {
        // Extract search query from message
        const searchQuery = message.replace(/search\s+/i, '').trim();
        const images = await this.imagesService.findAll({
          page: 1,
          limit: 20,
          search: searchQuery,
        });
        const imageList = images.images
          .map((img) => `- ${img.title || img.originalName} (${img.status})`)
          .join('\n');
        response = {
          content: `Found ${images.total} images for "${searchQuery}":\n\n${imageList}`,
          metadata: { action: 'search_images', query: searchQuery, count: images.total },
        };
      } else if (
        message.includes('list') ||
        message.includes('show') ||
        message.includes('images')
      ) {
        const images = await this.imagesService.findAll({
          page: 1,
          limit: 10,
        });
        const imageList = images.images
          .map((img) => `- ${img.title || img.originalName} (${img.status})`)
          .join('\n');
        response = {
          content: `Here are your images:\n\n${imageList}\n\nTotal: ${images.total} images`,
          metadata: { action: 'list_images', count: images.total },
        };
      } else if (message.includes('hello') || message.includes('hi')) {
        response = {
          content: "Hello! I'm your Gallery Assistant. I can help you:\n• List images\n• Search images\n• Upload images\n• Delete images\n• Manage your gallery",
          metadata: { action: 'greeting' },
        };
      } else if (message.includes('help')) {
        response = {
          content: "I can help you with:\n• List images - show all images\n• Search [query] - find specific images\n• Upload images - add new images\n• Delete [id] - remove an image\n• Count images - get total count",
          metadata: { action: 'help' },
        };
      } else if (message.includes('count') || message.includes('how many')) {
        const totalImages = await this.imagesService.findAll({ page: 1, limit: 1 });
        response = {
          content: `You have ${totalImages.total} images in your gallery.`,
          metadata: { action: 'count_images', total: totalImages.total },
        };
      } else {
        const totalImages = await this.imagesService.findAll({ page: 1, limit: 1 });
        response = {
          content: `You have ${totalImages.total} images in your gallery. Try:\n• "list images" - to see all images\n• "search [query]" - to find specific images\n• "count images" - to get total count`,
          metadata: { action: 'general', totalImages: totalImages.total },
        };
      }

      // Add to chat history
      this.chatHistory.push(response);
      
      // Keep only last 100 messages
      if (this.chatHistory.length > 100) {
        this.chatHistory = this.chatHistory.slice(-100);
      }

      return response;
    } catch (error) {
      this.logger.error('Error processing message:', error);
      return {
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
        metadata: { action: 'error', error: error.message }
      };
    }
  }

  async getHistory(limit: number = 50): Promise<ChatResponse[]> {
    return this.chatHistory.slice(-limit);
  }

}
