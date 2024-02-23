import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BullModule } from '@nestjs/bull';
import { UserService } from './users.service';
import { TaskService } from './task.service';
import { UserController } from './users.controller';
import { PrismaService } from './prisma.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { EmailConsumer } from './email.consumer';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: 6379,
      },
      defaultJobOptions: {
        attempts: 10,
        removeOnComplete: true,
      },
    }),
    BullModule.registerQueue({
      name: 'email',
    }),
  ],
  controllers: [AppController, UserController],
  providers: [
    AppService,
    TaskService,
    PrismaService,
    SchedulerRegistry,
    UserService,
    EmailConsumer,
  ],
})
export class AppModule {}
