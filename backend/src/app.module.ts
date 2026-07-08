import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsModule } from './projects/projects.module';
import { NotesModule } from './notes/notes.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SyncModule } from './sync/sync.module';
import { AgentModule } from './agent/agent.module';
import { AutomationsModule } from './automations/automations.module';
import { AutomationModule } from './automations/automation-module.entity';
import { AutomationInstance } from './automations/automation-instance.entity';
import { RunLog } from './automations/run-log.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER ?? 'skovoroda',
      password: process.env.DB_PASSWORD ?? 'skovoroda',
      database: process.env.DB_NAME ?? 'skovoroda',
      autoLoadEntities: true,
      // Phase 3 (automation) tables are provisioned upfront — entities below.
      entities: [AutomationModule, AutomationInstance, RunLog],
      // Dev mode: schema is synchronized automatically.
      // Switch to migrations before deploying to a VPS.
      synchronize: true,
    }),
    ProjectsModule,
    NotesModule,
    NotificationsModule,
    SyncModule,
    AgentModule,
    AutomationsModule,
  ],
})
export class AppModule {}
