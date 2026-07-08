import {
  Column, CreateDateColumn, Entity, OneToMany,
  PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { Note } from '../notes/note.entity';
import { Notification } from '../notifications/notification.entity';

export type ProjectStatus = 'active' | 'paused' | 'archived';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ type: 'varchar', default: 'active' })
  status: ProjectStatus;

  @Column({ type: 'varchar', nullable: true })
  repoUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  prodUrl: string | null;

  @OneToMany(() => Note, (n) => n.project)
  notes: Note[];

  @OneToMany(() => Notification, (n) => n.project)
  notifications: Notification[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
