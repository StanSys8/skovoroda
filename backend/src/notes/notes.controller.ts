import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto, UpdateNoteDto } from './note.dto';

@Controller('notes')
export class NotesController {
  constructor(private readonly service: NotesService) {}

  @Get()
  findByProject(@Query('projectId', ParseUUIDPipe) projectId: string) {
    return this.service.findByProject(projectId);
  }

  @Post()
  create(@Body() dto: CreateNoteDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateNoteDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
