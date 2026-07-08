import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { AgentCommand } from './agent-command.entity';
import { CreateCommandDto, ReportResultDto } from './agent.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { AutomationInstance } from '../automations/automation-instance.entity';
import { commandFromInstance } from '../automations/instance-command';

@Injectable()
export class AgentService {
  constructor(
    @InjectRepository(AgentCommand) private repo: Repository<AgentCommand>,
    @InjectRepository(AutomationInstance)
    private instances: Repository<AutomationInstance>,
    private dataSource: DataSource,
    private notifications: NotificationsService,
  ) {}

  /** Enqueue a command (called by sync, the UI, or an external API). */
  enqueue(dto: CreateCommandDto) {
    return this.repo.save(this.repo.create(dto));
  }

  /** Command list for the UI (latest 100). */
  list(status?: string, lane?: string) {
    return this.repo.find({
      where: {
        ...(status ? { status: status as AgentCommand['status'] } : {}),
        ...(lane ? { lane } : {}),
      },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  /** Instance ids that already have a command waiting or running. */
  async activeInstanceIds(): Promise<Set<string>> {
    const rows = await this.repo.find({
      select: { instanceId: true },
      where: { status: In(['pending', 'taken']) },
    });
    return new Set(
      rows.map((r) => r.instanceId).filter((id): id is string => !!id),
    );
  }

  /**
   * Atomically take the oldest pending command of a lane.
   * Lanes are strictly sequential: while a command of the lane is `taken`,
   * the next one is not handed out. The per-lane advisory lock serializes
   * concurrent polls, so this stays safe with multiple agent sessions.
   */
  async takeNext(lane = 'main'): Promise<AgentCommand | null> {
    return this.dataSource.transaction(async (em) => {
      await em.query('SELECT pg_advisory_xact_lock(hashtext($1))', [lane]);

      const repo = em.getRepository(AgentCommand);
      const busy = await repo.countBy({ lane, status: 'taken' });
      if (busy > 0) return null;

      const cmd = await repo.findOne({
        where: { lane, status: 'pending' },
        order: { createdAt: 'ASC' },
      });
      if (!cmd) return null;

      cmd.status = 'taken';
      cmd.takenAt = new Date();
      return em.save(cmd);
    });
  }

  /** Accept the agent's report and surface it as a notification. */
  async reportResult(dto: ReportResultDto) {
    const cmd = await this.repo.findOne({ where: { id: dto.commandId } });
    if (!cmd) throw new NotFoundException('Command not found');

    cmd.status = dto.status;
    cmd.resultSummary = dto.summary;
    cmd.resultDetails = dto.details ?? {};
    cmd.finishedAt = new Date();
    await this.repo.save(cmd);

    await this.notifications.emit({
      title:
        dto.status === 'done' ? `Done: ${cmd.title}` : `Failed: ${cmd.title}`,
      body: dto.summary,
      level: dto.status === 'done' ? 'success' : 'error',
      source: 'agent',
      projectId: cmd.projectId,
    });

    await this.reenqueuePersistent(cmd);
    await this.announceDrainedMainLane(cmd);

    return cmd;
  }

  /**
   * The morning sync only announces the start; the real "finished" moment
   * is when the last main-lane command gets reported and the lane drains.
   */
  private async announceDrainedMainLane(cmd: AgentCommand) {
    if (cmd.lane !== 'main') return;
    const remaining = await this.repo.countBy({
      lane: 'main',
      status: In(['pending', 'taken']),
    });
    if (remaining > 0) return;

    await this.notifications.emit({
      title: 'Morning routines finished',
      body: 'All queued commands are done. The agent is back to waiting.',
      level: 'info',
      source: 'system',
    });
  }

  /**
   * Persistent routines never leave their lane empty: as soon as a run is
   * reported, the next one is queued — while the instance stays enabled.
   * Pacing is up to the instruction itself (e.g. "watch for 10 minutes").
   */
  private async reenqueuePersistent(cmd: AgentCommand) {
    if (!cmd.instanceId) return;
    const inst = await this.instances.findOne({
      where: { id: cmd.instanceId },
      relations: { project: true },
    });
    if (!inst || !inst.persistent || !inst.enabled) return;

    const next = commandFromInstance(inst);
    if (next) await this.enqueue(next);
  }

  /**
   * Return stuck commands (taken but never reported — the agent session
   * died) back to the queue. Called by the morning sync. Only the "main"
   * lane: persistent lanes may legitimately run for hours.
   */
  async requeueStale(olderThanMinutes = 60) {
    const threshold = new Date(Date.now() - olderThanMinutes * 60_000);
    const res = await this.repo
      .createQueryBuilder()
      .update()
      .set({ status: 'pending', takenAt: null })
      .where('status = :s', { s: 'taken' })
      .andWhere('lane = :lane', { lane: 'main' })
      .andWhere('"takenAt" < :t', { t: threshold })
      .execute();
    return res.affected ?? 0;
  }

  /** Drop queued (not yet taken) commands of an instance. */
  async dropPendingForInstance(instanceId: string) {
    const res = await this.repo.delete({ instanceId, status: 'pending' });
    return res.affected ?? 0;
  }

  /**
   * Manual restart of an instance's queue: forget stuck runs and queue
   * a fresh one. Stuck `taken` commands are marked failed so the lane
   * unblocks immediately.
   */
  async restartInstance(inst: AutomationInstance) {
    await this.repo.delete({ instanceId: inst.id, status: 'pending' });
    await this.repo.update(
      { instanceId: inst.id, status: 'taken' },
      {
        status: 'failed',
        resultSummary: 'Superseded by a manual restart.',
        finishedAt: new Date(),
      },
    );

    const cmd = commandFromInstance(inst);
    if (!cmd) return null;
    return this.enqueue(cmd);
  }
}
