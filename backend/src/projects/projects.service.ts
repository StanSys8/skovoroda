import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { CreateProjectDto, UpdateProjectDto } from './project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private repo: Repository<Project>,
  ) {}

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string) {
    const project = await this.repo.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  create(dto: CreateProjectDto) {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateProjectDto) {
    const project = await this.findOne(id);
    Object.assign(project, dto);
    return this.repo.save(project);
  }

  async remove(id: string) {
    const project = await this.findOne(id);
    await this.repo.remove(project);
    return { deleted: true };
  }
}
