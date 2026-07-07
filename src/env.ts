/**
 * env.ts — Load a local `.env` file so keys/config can be managed from a file.
 *
 * Side-effect import: keep it FIRST in every entry point, before `config.ts`
 * reads `process.env`. A missing `.env` is fine — real environment variables
 * (e.g. those set by a container or systemd) still take precedence and work
 * unchanged. Copy `.env.example` to `.env` and fill it in.
 */
import 'dotenv/config';
