import {
  Body, Controller, Get, Header, Param, ParseUUIDPipe, Post,
} from '@nestjs/common';
import { InstructionsService } from './instructions.service';
import { CreateInstructionDto } from './instruction.dto';
import { INSTRUCTION_TEMPLATE } from './instruction-template';

@Controller('instructions')
export class InstructionsController {
  constructor(private readonly service: InstructionsService) {}

  /** Upload an md instruction (read client-side, sent as JSON). */
  @Post()
  create(@Body() dto: CreateInstructionDto) {
    return this.service.create(dto);
  }

  /** Delete instructions no routine references any more. */
  @Post('prune')
  prune() {
    return this.service.pruneUnused();
  }

  /** Instruction template with the mandatory sections. */
  @Get('template')
  @Header('Content-Type', 'text/markdown; charset=utf-8')
  template() {
    return INSTRUCTION_TEMPLATE;
  }

  /** Raw markdown for the agent (and for humans to review). */
  @Get(':id')
  @Header('Content-Type', 'text/markdown; charset=utf-8')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const file = await this.service.findOne(id);
    return file.content;
  }
}
