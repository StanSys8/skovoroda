import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import { AgentService } from '../agent/agent.service';
import { AutomationInstance } from '../automations/automation-instance.entity';
import { commandFromInstance } from '../automations/instance-command';

@Injectable()
export class SyncService {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly agent: AgentService,
    @InjectRepository(AutomationInstance)
    private readonly instances: Repository<AutomationInstance>,
  ) {}

  /**
   * Routines the Morning sync would run: enabled, attached to the morning
   * queue (not persistent) and carrying a usable instructionUrl.
   */
  private async findRunnable(withRelations = false) {
    const active = await this.instances.find({
      where: { enabled: true, morningSync: true, persistent: false },
      relations: withRelations ? { module: true, project: true } : undefined,
    });
    return active.filter((inst) => {
      const url = inst.config?.['instructionUrl'];
      return typeof url === 'string' && url.length > 0;
    });
  }

  /** How many routines a sync would run right now. */
  async status() {
    const runnable = await this.findRunnable();
    return { available: runnable.length };
  }

  /**
   * Morning sync:
   * 1) returns stuck "main" commands (taken but never reported) to the queue;
   * 2) enqueues a command for every morning routine into the "main" lane —
   *    the lane hands them to the agent strictly one at a time;
   * 3) skips routines whose previous run is still queued or in progress.
   */
  async run() {
    const requeued = await this.agent.requeueStale();

    const runnable = await this.findRunnable(true);
    const alreadyQueued = await this.agent.activeInstanceIds();

    let enqueued = 0;
    let skipped = 0;
    for (const inst of runnable) {
      if (alreadyQueued.has(inst.id)) {
        skipped++;
        continue;
      }
      const cmd = commandFromInstance(inst);
      if (!cmd) continue;
      await this.agent.enqueue(cmd);
      enqueued++;
    }

    // "Finished" is emitted by AgentService when the last main-lane
    // command is reported — here we only announce the start.
    await this.notifications.emit({
      title:
        enqueued > 0 || skipped > 0
          ? 'Morning sync started'
          : 'Morning sync: nothing to do',
      body:
        enqueued > 0 || skipped > 0
          ? `Commands enqueued for the agent: ${enqueued}.` +
            (skipped ? ` Still running from before: ${skipped}.` : '') +
            (requeued ? ` Stuck commands requeued: ${requeued}.` : '')
          : 'No morning routines yet. The agent queue is empty.',
      level: 'info',
      source: 'system',
    });

    return { enqueued, requeued, skipped };
  }
}
