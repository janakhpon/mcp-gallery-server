import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { AppController } from './app.controller';
import { ImagesModule } from './images/images.module';
import { SharedModule } from './shared/shared.module';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: { enabled: true },
    }),
    SharedModule,
    JobsModule,
    ImagesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
