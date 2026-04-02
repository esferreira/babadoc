import { mkdir } from "fs/promises";
import { join } from "path";

const UPLOADS_DIR = join(process.cwd(), "uploads");

export async function ensureUploadsDir(subPath?: string): Promise<string> {
  const dir = subPath ? join(UPLOADS_DIR, subPath) : UPLOADS_DIR;
  await mkdir(dir, { recursive: true });
  return dir;
}

export function getUploadPath(relativePath: string): string {
  return join(UPLOADS_DIR, relativePath);
}

export function getRelativePath(artifactId: string, fileName: string): string {
  return `artifacts/${artifactId}/${fileName}`;
}
