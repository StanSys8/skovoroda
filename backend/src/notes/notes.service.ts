import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Note } from './note.entity';
import { CreateNoteDto, UpdateNoteDto } from './note.dto';

@Injectable()
export class NotesService {
  constructor(@InjectRepository(Note) private repo: Repository<Note>) {}

  findByProject(projectId: string) {
    return this.repo.find({
      where: { projectId },
      order: { pinned: 'DESC', updatedAt: 'DESC' },
    });
  }

  create(dto: CreateNoteDto) {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateNoteDto) {
    const note = await this.repo.findOne({ where: { id } });
    if (!note) throw new NotFoundException('Note not found');
    Object.assign(note, dto);
    return this.repo.save(note);
  }

  async remove(id: string) {
    const note = await this.repo.findOne({ where: { id } });
    if (!note) throw new NotFoundException('Note not found');
    await this.repo.remove(note);
    return { deleted: true };
  }
}
