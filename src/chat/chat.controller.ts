import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { MCPRequest, ChatResponse } from './dto/chat.dto';

@ApiTags('chat')
@Controller({ path: 'mcp', version: '1' })
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Send message to MCP chat assistant' })
  @ApiResponse({ status: 200, description: 'Chat response', type: ChatResponse })
  async sendMessage(@Body() request: MCPRequest): Promise<ChatResponse> {
    return this.chatService.processMessage(request);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get chat history' })
  @ApiResponse({ status: 200, description: 'Chat history', type: [ChatResponse] })
  async getHistory(@Query('limit') limit?: number): Promise<ChatResponse[]> {
    return this.chatService.getHistory(limit || 50);
  }
}
