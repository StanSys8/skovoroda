import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationLevel } from './notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private repo: Repository<Notification>,
  ) {}

  findAll(opts: { projectId?: string; unreadOnly?: boolean }) {
    const where: Record<string, unknown> = {};
    if (opts.projectId) where.projectId = opts.projectId;
    if (opts.unreadOnly) where.read = false;
    return this.repo.find({ where, order: { createdAt: 'DESC' }, take: 100 });
  }

  /** Unread counters per project — used for dashboard card badges. */
  async unreadCounts(): Promise<Record<string, number>> {
    const rows = await this.repo
      .createQueryBuilder('n')
      .select('n.projectId', 'projectId')
      .addSelect('COUNT(*)', 'count')
      .where('n.read = false')
      .groupBy('n.projectId')
      .getRawMany<{ projectId: string | null; count: string }>();

    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row.projectId ?? 'global'] = Number(row.count);
    }
    return result;
  }

  /** Used by the core and (in phase 3) by automation runs. */
  emit(input: {
    title: string;
    body?: string;
    level?: NotificationLevel;
    source?: string;
    projectId?: string | null;
  }) {
    return this.repo.save(this.repo.create(input));
  }

  async markRead(id: string) {
    const n = await this.repo.findOne({ where: { id } });
    if (!n) throw new NotFoundException('Notification not found');
    n.read = true;
    return this.repo.save(n);
  }

  async markAllRead(projectId?: string) {
    const qb = this.repo
      .createQueryBuilder()
      .update()
      .set({ read: true })
      .where('read = false');
    if (projectId) qb.andWhere('"projectId" = :projectId', { projectId });
    await qb.execute();
    return { ok: true };
  }
}
