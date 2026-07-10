import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstructionFile } from './instruction-file.entity';
import { InstructionsService } from './instructions.service';
import { InstructionsController } from './instructions.controller';
import { AutomationInstance } from '../automations/automation-instance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InstructionFile, AutomationInstance])],
  providers: [InstructionsService],
  controllers: [InstructionsController],
  exports: [InstructionsService],
})
export class InstructionsModule {}
