import {
  CanActivate, ExecutionContext, Injectable, UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * Requires a shared secret on every /api request when API_KEY is set.
 * Accepts either `X-API-Key: <key>` or `Authorization: Bearer <key>`.
 *
 * When API_KEY is empty (local dev), the guard is a no-op — nothing breaks
 * until an operator opts into auth by setting the env var. This is the
 * primary defence against drive-by requests from a malicious page in the
 * user's browser (Ollama/Jupyter class): such a page runs on another origin
 * and cannot obtain the key, so all its requests are rejected regardless of
 * content type or CORS.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly key = process.env.API_KEY ?? '';

  canActivate(context: ExecutionContext): boolean {
    if (!this.key) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers['x-api-key'];
    const fromHeader = Array.isArray(header) ? header[0] : header;
    const auth = req.headers.authorization;
    const fromBearer = auth?.startsWith('Bearer ')
      ? auth.slice('Bearer '.length)
      : undefined;

    const provided = fromHeader || fromBearer;
    if (provided !== this.key) {
      throw new UnauthorizedException('Invalid or missing API key');
    }
    return true;
  }
}
