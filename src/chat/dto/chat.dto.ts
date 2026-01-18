import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

export class MCPRequest {
  @ApiProperty({ description: 'The message to send to the assistant' })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Optional context for the conversation',
    required: false
  })
  @IsOptional()
  @IsObject()
  context?: {
    currentImages?: string[];
    userId?: string;
  };

  @ApiProperty({ description: 'The AI provider to use', required: false, enum: ['openai', 'gemini'] })
  @IsString()
  @IsOptional()
  provider?: 'openai' | 'gemini';
}

export class ChatResponse {
  @ApiProperty({ description: 'The assistant response' })
  content: string;

  @ApiProperty({
    description: 'Optional metadata about the response',
    required: false
  })
  metadata?: {
    imageId?: string;
    action?: string;
    [key: string]: any;
  };
}
