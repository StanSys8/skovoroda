import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AutomationInstance } from './automation-instance.entity';

export type RunStatus = 'success' | 'failure' | 'skipped';

/** Automation run history. Populated in phase 3. */
@Entity('run_logs')
export class RunLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AutomationInstance, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'instanceId' })
  instance: AutomationInstance;

  @Column()
  instanceId: string;

  @Column({ type: 'varchar' })
  status: RunStatus;

  @Column({ type: 'text', default: '' })
  summary: string;

  @Column({ type: 'jsonb', default: {} })
  details: Record<string, unknown>;

  @Column({ type: 'int', default: 0 })
  durationMs: number;

  @CreateDateColumn()
  startedAt: Date;
}
