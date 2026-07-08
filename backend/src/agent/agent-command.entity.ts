import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Project } from '../projects/project.entity';

export type CommandStatus = 'pending' | 'taken' | 'done' | 'failed';
export type RiskLevel = 'read' | 'write' | 'external';

/**
 * Command queue for the LLM executor agent.
 * The agent picks up commands via GET /api/agent/poll (blocking bash loop),
 * executes the md instruction at instructionUrl,
 * and reports back via POST /api/agent/result.
 */
@Entity('agent_commands')
export class AgentCommand {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Human-readable command title, e.g. "Check WZKai results". */
  @Column()
  title: string;

  /**
   * Link to an md file with a detailed instruction for the agent
   * (a local path or a URL of another API serving markdown).
   */
  @Column()
  instructionUrl: string;

  /** Extra parameters for the instruction (values from instance config). */
  @Column({ type: 'jsonb', default: {} })
  payload: Record<string, unknown>;

  /**
   * read     — read/parse only, executed without confirmation;
   * write    — mutates local data, requires a config flag;
   * external — sends data outside, requires explicit human confirmation.
   */
  @Column({ type: 'varchar', default: 'read' })
  riskLevel: RiskLevel;

  @Column({ type: 'varchar', default: 'pending' })
  status: CommandStatus;

  /**
   * Delivery lane. Within one lane commands are handed out strictly
   * sequentially: the next one is not given away while another is `taken`.
   * "main" — the Morning sync queue; persistent routines use `inst:<id>`
   * and are polled by their own agent session (poll?lane=...).
   */
  @Column({ type: 'varchar', default: 'main' })
  lane: string;

  /** The automation instance that produced this command, if any. */
  @Column({ type: 'uuid', nullable: true })
  instanceId: string | null;

  @Column({ type: 'text', default: '' })
  resultSummary: string;

  @Column({ type: 'jsonb', default: {} })
  resultDetails: Record<string, unknown>;

  @ManyToOne(() => Project, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'projectId' })
  project: Project | null;

  @Column({ type: 'uuid', nullable: true })
  projectId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  takenAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  finishedAt: Date | null;
}
