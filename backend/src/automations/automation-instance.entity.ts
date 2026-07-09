import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne,
  PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { AutomationModule } from './automation-module.entity';
import { Project } from '../projects/project.entity';

/**
 * An automation (routine) bound to a project.
 * morningSync routines are enqueued one-by-one by the "Morning sync" button;
 * persistent routines run continuously on a dedicated agent session
 * polling their own lane (`inst:<id>`).
 */
@Entity('automation_instances')
export class AutomationInstance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Human-readable routine name shown in the UI and command titles. */
  @Column({ default: '' })
  name: string;

  /** Optional link to a registered module (configSchema registry — roadmap). */
  @ManyToOne(() => AutomationModule, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'moduleId' })
  module: AutomationModule | null;

  @Column({ type: 'uuid', nullable: true })
  moduleId: string | null;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  projectId: string;

  @Column({ default: true })
  enabled: boolean;

  /** Included in the Morning sync queue (lane "main", sequential). */
  @Column({ default: false })
  morningSync: boolean;

  /**
   * Persistent routine: lives on its own lane (`inst:<id>`) served by
   * a dedicated agent session; the backend re-enqueues the next run
   * as soon as the previous one is reported. Mutually exclusive with
   * morningSync.
   */
  @Column({ default: false })
  persistent: boolean;

  /**
   * Minutes the backend waits before re-arming a persistent routine's next
   * run. 0 = re-arm immediately. Ignored for non-persistent routines.
   */
  @Column({ type: 'int', default: 0 })
  intervalMinutes: number;

  /** Parameter values conforming to the module's configSchema. */
  @Column({ type: 'jsonb', default: {} })
  config: Record<string, unknown>;

  /** Cron expression for autonomous runs; null = manual sync only. */
  @Column({ type: 'varchar', nullable: true })
  schedule: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
