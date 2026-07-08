import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstructionFile } from './instruction-file.entity';
import { InstructionsService } from './instructions.service';
import { InstructionsController } from './instructions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InstructionFile])],
  providers: [InstructionsService],
  controllers: [InstructionsController],
})
export class InstructionsModule {}
