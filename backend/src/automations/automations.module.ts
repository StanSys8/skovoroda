import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutomationInstance } from './automation-instance.entity';
import { AutomationsService } from './automations.service';
import { AutomationsController } from './automations.controller';
import { AgentModule } from '../agent/agent.module';

@Module({
  imports: [TypeOrmModule.forFeature([AutomationInstance]), AgentModule],
  providers: [AutomationsService],
  controllers: [AutomationsController],
  exports: [AutomationsService],
})
export class AutomationsModule {}
