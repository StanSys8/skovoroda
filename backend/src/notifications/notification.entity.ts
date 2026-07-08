import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Project } from '../projects/project.entity';

export type NotificationLevel =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'security';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', default: '' })
  body: string;

  @Column({ type: 'varchar', default: 'info' })
  level: NotificationLevel;

  @Column({ default: false })
  read: boolean;

  /** Origin: 'system' or the name of an automation module. */
  @Column({ type: 'varchar', default: 'system' })
  source: string;

  @ManyToOne(() => Project, (p) => p.notifications, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'projectId' })
  project: Project | null;

  @Column({ type: 'uuid', nullable: true })
  projectId: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
