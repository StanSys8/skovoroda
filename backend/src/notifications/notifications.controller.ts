import {
  Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  findAll(
    @Query('projectId') projectId?: string,
    @Query('unread') unread?: string,
  ) {
    return this.service.findAll({
      projectId: projectId || undefined,
      unreadOnly: unread === 'true',
    });
  }

  @Get('unread-counts')
  unreadCounts() {
    return this.service.unreadCounts();
  }

  @Patch(':id/read')
  markRead(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.markRead(id);
  }

  @Post('read-all')
  markAllRead(@Query('projectId') projectId?: string) {
    return this.service.markAllRead(projectId || undefined);
  }
}
