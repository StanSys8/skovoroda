import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateInstructionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Matches(/\.md$/i, { message: 'filename must end with .md' })
  filename: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200_000)
  content: string;
}
