import {
  Column, CreateDateColumn, Entity, PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * An uploaded md instruction. Routines point at it via
 * instructionUrl = /api/instructions/<id>; the agent fetches it with curl.
 */
@Entity('instruction_files')
export class InstructionFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Original filename, shown in the UI. */
  @Column()
  filename: string;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn()
  createdAt: Date;
}
