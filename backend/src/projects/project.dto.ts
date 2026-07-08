import { IsIn, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['active', 'paused', 'archived'])
  status?: 'active' | 'paused' | 'archived';

  @IsOptional()
  @IsUrl({ require_tld: false })
  repoUrl?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  prodUrl?: string;
}

export class UpdateProjectDto extends CreateProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name: string;
}
