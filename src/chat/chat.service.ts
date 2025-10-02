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
      // Simple keyword-based responses for now
      const message = request.message.toLowerCase();
      let response: ChatResponse;

      if (message.includes('hello') || message.includes('hi')) {
        response = {
          content: "Hello! I'm your Gallery Assistant. I can help you manage your images, upload new ones, or answer questions about your gallery. How can I assist you today?",
          metadata: { action: 'greeting' }
        };
      } else if (message.includes('list') || message.includes('show') || message.includes('images')) {
        const images = await this.imagesService.findAll({ page: 1, limit: 10 });
        const imageList = images.images.map(img => `- ${img.title} (${img.status})`).join('\n');
        response = {
          content: `Here are your recent images:\n\n${imageList}\n\nTotal: ${images.total} images`,
          metadata: { action: 'list_images', count: images.total }
        };
      } else if (message.includes('upload') || message.includes('add')) {
        response = {
          content: "To upload an image, you can drag and drop it onto the gallery or use the upload button. I can help you organize and manage your uploaded images!",
          metadata: { action: 'upload_help' }
        };
      } else if (message.includes('help')) {
        response = {
          content: "I can help you with:\n\n• Listing your images\n• Uploading new images\n• Managing your gallery\n• Answering questions about your images\n\nJust ask me what you'd like to do!",
          metadata: { action: 'help' }
        };
      } else if (message.includes('status') || message.includes('ready')) {
        const images = await this.imagesService.findAll({ page: 1, limit: 100 });
        const readyImages = images.images.filter(img => img.status === 'READY').length;
        const processingImages = images.images.filter(img => img.status === 'PROCESSING').length;
        const pendingImages = images.images.filter(img => img.status === 'PENDING').length;
        
        response = {
          content: `Gallery Status:\n\n• Ready: ${readyImages} images\n• Processing: ${processingImages} images\n• Pending: ${pendingImages} images\n• Total: ${images.total} images`,
          metadata: { action: 'status', ready: readyImages, processing: processingImages, pending: pendingImages }
        };
      } else {
        response = {
          content: "I understand you're asking about: \"" + request.message + "\". I'm here to help with your image gallery. You can ask me to list images, check status, or help with uploads. What would you like to know?",
          metadata: { action: 'general' }
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
