import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class FindImagesDto {
  @ApiProperty({ required: false, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, minimum: 1, maximum: 100, default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 12;

  @ApiProperty({ required: false, enum: ['PENDING', 'PROCESSING', 'READY', 'FAILED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false, description: 'Search in title and description' })
  @IsOptional()
  @IsString()
  search?: string;
}

export interface ImagesResponse {
  images: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
