import {
  Body, Controller, Delete, Get, Header, Param, ParseUUIDPipe, Patch, Post,
  Query,
} from '@nestjs/common';
import { AutomationsService } from './automations.service';
import { CreateAutomationDto, UpdateAutomationDto } from './automation.dto';
import { buildInitMarkdown } from '../agent/agent-init';
import { instanceLane } from './instance-command';

@Controller('automations')
export class AutomationsController {
  constructor(private readonly service: AutomationsService) {}

  @Get()
  list(@Query('projectId') projectId?: string) {
    return this.service.list(projectId || undefined);
  }

  @Post()
  create(@Body() dto: CreateAutomationDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAutomationDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  /** Run now (one-off to "main", or restart a persistent routine's lane). */
  @Post(':id/run')
  run(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.run(id);
  }

  /** Ready-to-run init.md for this routine's session (lane baked in). */
  @Get(':id/init')
  @Header('Content-Type', 'text/markdown; charset=utf-8')
  async init(@Param('id', ParseUUIDPipe) id: string) {
    const inst = await this.service.findOne(id);
    return buildInitMarkdown({
      lane: instanceLane(inst),
      intervalMinutes: inst.intervalMinutes,
      routine: {
        name: inst.name || 'Automation',
        instructionUrl: String(inst.config?.['instructionUrl'] ?? ''),
      },
    });
  }
}
