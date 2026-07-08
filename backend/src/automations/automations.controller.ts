import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import { AutomationsService } from './automations.service';
import { CreateAutomationDto, UpdateAutomationDto } from './automation.dto';

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
}
