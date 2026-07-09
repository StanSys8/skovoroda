import {
  Body, Controller, Get, Header, HttpCode, Post, Query, Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AgentService } from './agent.service';
import { CreateCommandDto, ReportResultDto } from './agent.dto';
import { buildInitMarkdown } from './agent-init';

@Controller('agent')
export class AgentController {
  constructor(private readonly service: AgentService) {}

  /**
   * Poll endpoint for the agent's bash loop.
   * Empty queue → 204 No Content (empty body, the loop keeps sleeping).
   * Command available → 200 with the command JSON
   * (bash exits, the LLM wakes up).
   * ?lane= selects the delivery lane: "main" (default, morning sync) or
   * `inst:<id>` for a persistent routine's dedicated session. Within
   * a lane commands are handed out one at a time.
   */
  @Get('poll')
  async poll(@Res() res: Response, @Query('lane') lane?: string) {
    const cmd = await this.service.takeNext(lane || 'main');
    if (!cmd) return res.status(204).send();
    return res.status(200).json(cmd);
  }

  /** Default init.md (main lane) for a plain agent session. */
  @Get('init')
  @Header('Content-Type', 'text/markdown; charset=utf-8')
  init(@Query('lane') lane?: string) {
    return buildInitMarkdown({ lane: lane || 'main' });
  }

  /** Agent's execution report. */
  @Post('result')
  @HttpCode(200)
  reportResult(@Body() dto: ReportResultDto) {
    return this.service.reportResult(dto);
  }

  /** Enqueue a command manually (UI / curl / external API). */
  @Post('commands')
  enqueue(@Body() dto: CreateCommandDto) {
    return this.service.enqueue(dto);
  }

  /** Inspect the queue. */
  @Get('commands')
  list(@Query('status') status?: string, @Query('lane') lane?: string) {
    return this.service.list(status || undefined, lane || undefined);
  }
}
