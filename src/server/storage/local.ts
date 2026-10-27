import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { getServerEnvironment } from "../env";

export interface ObjectStorage {
  put(key: string, content: Uint8Array | string): Promise<void>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}

function safePath(root: string, key: string): string {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(resolvedRoot, key);
  if (!resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error("Storage key escapes the configured root.");
  }
  return resolvedTarget;
}

export class LocalObjectStorage implements ObjectStorage {
  constructor(
    private readonly root = getServerEnvironment().LOCAL_STORAGE_ROOT,
  ) {}

  async put(key: string, content: Uint8Array | string): Promise<void> {
    const target = safePath(this.root, key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content, { flag: "wx" });
  }

  async get(key: string): Promise<Buffer> {
    return readFile(safePath(this.root, key));
  }

  async delete(key: string): Promise<void> {
    await rm(safePath(this.root, key), { force: true });
  }
}

export const objectStorage = new LocalObjectStorage();
