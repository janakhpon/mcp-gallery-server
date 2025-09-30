import { ApiProperty } from '@nestjs/swagger';

export class Image {
  @ApiProperty()
  id!: string;
  @ApiProperty({ required: false })
  title?: string;
  @ApiProperty({ required: false })
  description?: string;
  @ApiProperty()
  originalName!: string;
  @ApiProperty()
  mimeType!: string;
  @ApiProperty()
  size!: number;
  @ApiProperty({ required: false })
  width?: number;
  @ApiProperty({ required: false })
  height?: number;
  @ApiProperty({ required: false })
  s3Key?: string;
  @ApiProperty({ required: false })
  s3Url?: string;
  @ApiProperty()
  status!: 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';
  @ApiProperty()
  createdAt!: Date;
  @ApiProperty()
  updatedAt!: Date;
}
