import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module';
import { AgentModule } from '../agent/agent.module';
import { AutomationInstance } from '../automations/automation-instance.entity';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AutomationInstance]),
    NotificationsModule,
    AgentModule,
  ],
  providers: [SyncService],
  controllers: [SyncController],
})
export class SyncModule {}
