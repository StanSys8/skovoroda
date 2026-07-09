import {
  BadRequestException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AutomationInstance } from './automation-instance.entity';
import { CreateAutomationDto, UpdateAutomationDto } from './automation.dto';
import { AgentService } from '../agent/agent.service';
import { commandFromInstance } from './instance-command';

@Injectable()
export class AutomationsService {
  constructor(
    @InjectRepository(AutomationInstance)
    private repo: Repository<AutomationInstance>,
    private agent: AgentService,
  ) {}

  list(projectId?: string) {
    return this.repo.find({
      where: projectId ? { projectId } : {},
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string) {
    const inst = await this.repo.findOne({
      where: { id },
      relations: { project: true },
    });
    if (!inst) throw new NotFoundException('Automation not found');
    return inst;
  }

  async create(dto: CreateAutomationDto) {
    if (dto.morningSync && dto.persistent) {
      throw new BadRequestException(
        'morningSync and persistent are mutually exclusive',
      );
    }

    const inst = await this.repo.save(
      this.repo.create({
        projectId: dto.projectId,
        name: dto.name,
        morningSync: dto.morningSync ?? false,
        persistent: dto.persistent ?? false,
        intervalMinutes: dto.intervalMinutes ?? 0,
        enabled: dto.enabled ?? true,
        config: {
          ...(dto.payload ?? {}),
          instructionUrl: dto.instructionUrl,
          riskLevel: dto.riskLevel ?? 'read',
        },
      }),
    );

    // A persistent routine starts living as soon as it is enabled:
    // its first command lands in the dedicated lane right away.
    if (inst.persistent && inst.enabled) await this.ensureQueued(inst.id);

    return this.findOne(inst.id);
  }

  async update(id: string, dto: UpdateAutomationDto) {
    const inst = await this.findOne(id);
    const wasActive = inst.persistent && inst.enabled;

    if (dto.name !== undefined) inst.name = dto.name;
    if (dto.morningSync !== undefined) inst.morningSync = dto.morningSync;
    if (dto.persistent !== undefined) inst.persistent = dto.persistent;
    if (dto.intervalMinutes !== undefined) {
      inst.intervalMinutes = dto.intervalMinutes;
    }
    if (dto.enabled !== undefined) inst.enabled = dto.enabled;
    if (inst.morningSync && inst.persistent) {
      throw new BadRequestException(
        'morningSync and persistent are mutually exclusive',
      );
    }

    if (dto.instructionUrl !== undefined || dto.riskLevel !== undefined || dto.payload !== undefined) {
      inst.config = {
        ...inst.config,
        ...(dto.payload ?? {}),
        ...(dto.instructionUrl !== undefined
          ? { instructionUrl: dto.instructionUrl }
          : {}),
        ...(dto.riskLevel !== undefined ? { riskLevel: dto.riskLevel } : {}),
      };
    }

    await this.repo.save(inst);

    const isActive = inst.persistent && inst.enabled;
    if (isActive && !wasActive) await this.ensureQueued(inst.id);
    if (!isActive && wasActive) {
      // Turned off: queued runs are dropped; a run in progress finishes
      // on its own and will not be re-enqueued (instance is disabled).
      await this.agent.dropPendingForInstance(inst.id);
    }

    return this.findOne(inst.id);
  }

  async remove(id: string) {
    const inst = await this.findOne(id);
    await this.agent.dropPendingForInstance(inst.id);
    await this.repo.remove(inst);
    return { deleted: true };
  }

  /**
   * Run now. For a persistent routine this restarts its lane (stuck runs
   * are marked failed); for others it queues a one-off into "main" unless
   * one is already waiting.
   */
  async run(id: string) {
    const inst = await this.findOne(id);

    if (inst.persistent) {
      const cmd = await this.agent.restartInstance(inst);
      if (!cmd) throw new BadRequestException('Instance has no instructionUrl');
      return cmd;
    }

    const active = await this.agent.activeInstanceIds();
    if (active.has(inst.id)) {
      throw new BadRequestException('A run is already queued or in progress');
    }

    const cmd = commandFromInstance(inst);
    if (!cmd) throw new BadRequestException('Instance has no instructionUrl');
    return this.agent.enqueue(cmd);
  }

  /** Queue a persistent instance's next run unless one is already active. */
  private async ensureQueued(id: string) {
    const inst = await this.findOne(id);
    const active = await this.agent.activeInstanceIds();
    if (active.has(inst.id)) return;

    const cmd = commandFromInstance(inst);
    if (cmd) await this.agent.enqueue(cmd);
  }
}
