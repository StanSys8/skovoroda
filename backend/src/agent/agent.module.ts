import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentCommand } from './agent-command.entity';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { AutomationInstance } from '../automations/automation-instance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AgentCommand, AutomationInstance]),
    NotificationsModule,
  ],
  providers: [AgentService],
  controllers: [AgentController],
  exports: [AgentService],
})
export class AgentModule {}
