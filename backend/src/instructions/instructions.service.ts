import {
  BadRequestException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstructionFile } from './instruction-file.entity';
import { CreateInstructionDto } from './instruction.dto';
import { missingSections } from './instruction-template';

@Injectable()
export class InstructionsService {
  constructor(
    @InjectRepository(InstructionFile)
    private repo: Repository<InstructionFile>,
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
}
