import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutomationInstance } from './automation-instance.entity';
import { AutomationsService } from './automations.service';
import { AutomationsController } from './automations.controller';
import { AgentModule } from '../agent/agent.module';
import { InstructionsModule } from '../instructions/instructions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AutomationInstance]),
    AgentModule,
    InstructionsModule,
  ],
  providers: [AutomationsService],
  controllers: [AutomationsController],
  exports: [AutomationsService],
})
export class AutomationsModule {}
