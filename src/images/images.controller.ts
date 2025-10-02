import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Query,
} from '@nestjs/common';
import type { File as MulterFile } from 'multer';
import { ImagesService } from './images.service';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { FindImagesDto } from './dto/find-images.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags, ApiResponse } from '@nestjs/swagger';
import { Image } from './entities/image.entity';

@ApiTags('images')
@Controller({ path: 'images', version: '1' })
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Image uploaded successfully', type: Image })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        title: { type: 'string', maxLength: 120 },
        description: { type: 'string', maxLength: 500 },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  create(@UploadedFile() file: MulterFile, @Body() createImageDto: CreateImageDto) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.imagesService.create(
      {
        ...createImageDto,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
      file.buffer,
    );
  }

  @Get()
  @ApiResponse({ status: 200, description: 'List all images with pagination' })
  findAll(@Query() query: FindImagesDto) {
    return this.imagesService.findAll(query);
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Get image by ID', type: Image })
  findOne(@Param('id') id: string) {
    return this.imagesService.findOne(id);
  }

  @Get(':id/download')
  @ApiResponse({ status: 200, description: 'Get presigned download URL' })
  async getDownloadUrl(@Param('id') id: string) {
    return this.imagesService.getDownloadUrl(id);
  }

  @Patch(':id')
  @ApiResponse({ status: 200, description: 'Image updated', type: Image })
  update(@Param('id') id: string, @Body() updateImageDto: UpdateImageDto) {
    return this.imagesService.update(id, updateImageDto);
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Image deleted', type: Image })
  remove(@Param('id') id: string) {
    return this.imagesService.remove(id);
  }
}
