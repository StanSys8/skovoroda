import {
  IsIn, IsObject, IsOptional, IsString, IsUUID, MinLength,
} from 'class-validator';

export class CreateCommandDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @MinLength(1)
  instructionUrl: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @IsOptional()
  @IsIn(['read', 'write', 'external'])
  riskLevel?: 'read' | 'write' | 'external';

  @IsOptional()
  @IsUUID()
  projectId?: string;

  /** Delivery lane; defaults to "main" (the Morning sync queue). */
  @IsOptional()
  @IsString()
  @MinLength(1)
  lane?: string;

  @IsOptional()
  @IsUUID()
  instanceId?: string;
}

export class ReportResultDto {
  @IsUUID()
  commandId: string;

  @IsIn(['done', 'failed'])
  status: 'done' | 'failed';

  @IsString()
  summary: string;

  @IsOptional()
  @IsObject()
  details?: Record<string, unknown>;
}
