import { IsBoolean, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateNoteDto {
  @IsUUID()
  projectId: string;

  @IsString()
  @MinLength(1)
  content: string;

  @IsOptional()
  @IsBoolean()
  pinned?: boolean;
}

export class UpdateNoteDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @IsOptional()
  @IsBoolean()
  pinned?: boolean;
}
