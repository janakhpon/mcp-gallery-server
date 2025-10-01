import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

interface UploadParams {
  bucket: string;
  key: string;
  body: Buffer;
  contentType: string;
}

@Injectable()
export class S3Service implements OnModuleInit {
  private readonly s3: S3Client;
  private readonly forcePathStyle: boolean;
  private readonly logger = new Logger(S3Service.name);

  constructor() {
    let endpoint = process.env.S3_ENDPOINT;
    const region = process.env.S3_REGION ?? 'us-east-1';
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    this.forcePathStyle =
      (process.env.S3_FORCE_PATH_STYLE ?? 'true') === 'true';

    // Local dev convenience: if endpoint host is 'minio' but we're not in Docker, use 127.0.0.1
    try {
      if (endpoint) {
        const url = new URL(endpoint);
        const isDocker =
          process.env.DOCKER_COMPOSE === 'true' ||
          process.env.DOCKER === 'true';
        if (
          url.hostname === 'minio' &&
          !isDocker &&
          process.env.NODE_ENV !== 'production'
        ) {
          url.hostname = '127.0.0.1';
          endpoint = url.toString();
        }
      }
    } catch {
      // ignore malformed endpoint; let SDK throw if needed
    }

    this.s3 = new S3Client({
      region,
      endpoint,
      forcePathStyle: this.forcePathStyle,
      credentials:
        accessKeyId && secretAccessKey
          ? { accessKeyId, secretAccessKey }
          : undefined,
    });
  }

  async onModuleInit() {
    await this.ensureBucketExists();
  }

  private async ensureBucketExists(): Promise<void> {
    const bucket = process.env.S3_BUCKET ?? 'image-gallery';
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: bucket }));
      this.logger.log(`S3 bucket '${bucket}' exists and is accessible`);
    } catch (error: any) {
      if (
        error.name === 'NotFound' ||
        error.$metadata?.httpStatusCode === 404
      ) {
        this.logger.warn(
          `S3 bucket '${bucket}' not found, attempting to create...`,
        );
        try {
          await this.s3.send(new CreateBucketCommand({ Bucket: bucket }));
          this.logger.log(`S3 bucket '${bucket}' created successfully`);
          
          // Make bucket publicly readable for development
          if (process.env.NODE_ENV !== 'production') {
            const policy = {
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: '*',
                  Action: ['s3:GetObject'],
                  Resource: [`arn:aws:s3:::${bucket}/*`],
                },
              ],
            };
            
            await this.s3.send(
              new PutBucketPolicyCommand({
                Bucket: bucket,
                Policy: JSON.stringify(policy),
              }),
            );
            this.logger.log(`Bucket '${bucket}' set to public read access`);
          }
        } catch (createError: any) {
          this.logger.error(
            `Failed to create bucket '${bucket}': ${createError.message}`,
          );
        }
      } else {
        this.logger.warn(`Cannot verify bucket '${bucket}': ${error.message}`);
      }
    }
  }

  async uploadObject(
    params: UploadParams,
  ): Promise<{ key: string; url: string }> {
    const command = new PutObjectCommand({
      Bucket: params.bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    });
    await this.s3.send(command);
    const endpoint = process.env.S3_ENDPOINT ?? '';
    const base = this.forcePathStyle
      ? `${endpoint}/${params.bucket}`
      : `${endpoint}`;
    const url = `${base}/${params.key}`;
    return { key: params.key, url };
  }

  async getObjectBuffer(bucket: string, key: string): Promise<Buffer> {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const res = await this.s3.send(command);
    const stream = res.Body as Readable;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  async getSignedUrl(bucket: string, key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(this.s3, command, { expiresIn });
  }
}
