import {
  IsBoolean, IsIn, IsInt, IsObject, IsOptional, IsString, IsUUID, Max, Min,
  MinLength,
} from 'class-validator';

export class CreateAutomationDto {
  @IsUUID()
  projectId: string;

  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  instructionUrl: string;

  @IsOptional()
  @IsIn(['read', 'write', 'external'])
  riskLevel?: 'read' | 'write' | 'external';

  /** Extra instruction parameters merged into the instance config. */
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  morningSync?: boolean;

  @IsOptional()
  @IsBoolean()
  persistent?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_080)
  intervalMinutes?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateAutomationDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  instructionUrl?: string;

  @IsOptional()
  @IsIn(['read', 'write', 'external'])
  riskLevel?: 'read' | 'write' | 'external';

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  morningSync?: boolean;

  @IsOptional()
  @IsBoolean()
  persistent?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_080)
  intervalMinutes?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
