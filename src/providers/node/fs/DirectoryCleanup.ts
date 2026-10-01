import fs from 'fs';
import path from 'path';

// Shared by both the Electron main process (src-electron/ipc/node-fs-impl.ts)
// and the renderer's FsProvider implementation (NodeFs.ts), which otherwise
// each re-implemented the same logic independently.
export async function emptyDirectory(directory: string): Promise<void> {
    for (const entry of await fs.promises.readdir(directory)) {
        await fs.promises.rm(path.join(directory, entry), { recursive: true, force: true });
    }
}

export async function removeDirectoryRecursively(directory: string): Promise<void> {
    const stat = await fs.promises.lstat(directory).catch(() => undefined);
    if (stat === undefined || !stat.isDirectory()) {
        return;
    }

    await fs.promises.rm(directory, { recursive: true, force: true });
}
