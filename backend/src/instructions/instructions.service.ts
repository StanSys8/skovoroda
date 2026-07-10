import {
  BadRequestException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstructionFile } from './instruction-file.entity';
import { CreateInstructionDto } from './instruction.dto';
import { missingSections } from './instruction-template';
import { AutomationInstance } from '../automations/automation-instance.entity';

@Injectable()
export class InstructionsService {
  constructor(
    @InjectRepository(InstructionFile)
    private repo: Repository<InstructionFile>,
    @InjectRepository(AutomationInstance)
    private instances: Repository<AutomationInstance>,
  ) {}

  async create(dto: CreateInstructionDto) {
    const missing = missingSections(dto.content);
    if (missing.length > 0) {
      throw new BadRequestException(
        `Instruction is missing required sections: ${missing
          .map((s) => `"## ${s}"`)
          .join(', ')}. Download the template for the expected structure.`,
      );
    }

    const file = await this.repo.save(this.repo.create(dto));
    return {
      id: file.id,
      filename: file.filename,
      url: `/api/instructions/${file.id}`,
    };
  }

  async findOne(id: string) {
    const file = await this.repo.findOne({ where: { id } });
    if (!file) throw new NotFoundException('Instruction not found');
    return file;
  }

  /**
   * Delete uploaded instructions that no routine points at any more.
   * Called after an automation is removed and available as a manual sweep.
   */
  async pruneUnused(): Promise<{ deleted: number }> {
    const instances = await this.instances.find();
    const used = new Set<string>();
    for (const inst of instances) {
      const url = inst.config?.['instructionUrl'];
      const m =
        typeof url === 'string'
          ? url.match(/\/instructions\/([0-9a-fA-F-]{36})/)
          : null;
      if (m) used.add(m[1].toLowerCase());
    }

    const files = await this.repo.find({ select: { id: true } });
    const orphans = files
      .map((f) => f.id)
      .filter((id) => !used.has(id.toLowerCase()));
    if (orphans.length === 0) return { deleted: 0 };

    await this.repo.delete(orphans);
    return { deleted: orphans.length };
  }
}
