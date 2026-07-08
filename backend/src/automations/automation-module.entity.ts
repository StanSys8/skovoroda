import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Registry of available black-box automation modules.
 * Each module declares a manifest: the schema of its configuration parameters.
 * Populated in phase 3.
 */
@Entity('automation_modules')
export class AutomationModule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Technical module key, e.g. 'wzkai-monitor'. */
  @Column({ unique: true })
  key: string;

  @Column()
  name: string;

  @Column({ type: 'text', default: '' })
  description: string;

  /** JSON schema of parameters the module requires from its configuration. */
  @Column({ type: 'jsonb', default: {} })
  configSchema: Record<string, unknown>;

  @Column({ default: '0.1.0' })
  version: string;

  @CreateDateColumn()
  createdAt: Date;
}
