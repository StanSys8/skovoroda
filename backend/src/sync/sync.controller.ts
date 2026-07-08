import { Controller, Get, Post } from '@nestjs/common';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly service: SyncService) {}

  @Post()
  run() {
    return this.service.run();
  }

  @Get('status')
  status() {
    return this.service.status();
  }
}
