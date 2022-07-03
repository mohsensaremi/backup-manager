import * as fs from 'fs';
import * as NodejsPath from 'path';
import { DiskFile } from '../entity/DiskFile';
import { StorageFile } from '../entity/StorageFile';
import { Storage } from './Storage';

export class DiskStorage implements Storage {
  constructor(private readonly basePath: string) {}

  filesIterable(): AsyncIterable<DiskFile[]> {
    const dirs: string[] = [this.basePath];
    const next = async (
      initialFiles?: DiskFile[],
    ): Promise<IteratorResult<DiskFile[], DiskFile[] | undefined>> => {
      const dir = dirs.shift();
      if (!dir) {
        return { done: true, value: undefined };
      }
      const filesAndDirs = await fs.promises.readdir(dir);
      const files: DiskFile[] = initialFiles || [];
      for (let i = 0; i < filesAndDirs.length; i++) {
        const path = filesAndDirs[i];
        const fixedPath = this.fixPath(`${dir}/${path}`);
        const stat = await fs.promises.stat(fixedPath);
        if (stat.isDirectory()) {
          dirs.push(fixedPath);
        } else {
          files.push(
            new DiskFile(fixedPath.replace(this.basePath, ''), this.basePath),
          );
        }
      }
      if (files.length === 0) {
        return asyncIterator.next();
      } else if (files.length < 50) {
        return next(files);
      }
      return { done: false, value: files };
    };
    const asyncIterator: AsyncIterator<DiskFile[]> = {
      next: async (): Promise<
        IteratorResult<DiskFile[], DiskFile[] | undefined>
      > => next(),
    };

    return {
      [Symbol.asyncIterator]: () => asyncIterator,
    };
  }

  async hasFile(file: StorageFile) {
    try {
      await fs.promises.access(`${this.basePath}${file.path}`);
      const otherFile = new DiskFile(file.path, this.basePath);
      return otherFile.isEqual(file);
    } catch {}
    return false;
  }

  async putFile(sourceFile: StorageFile) {
    const inputStream = await sourceFile.createReadableStream();

    const targetPath = `${this.basePath}${sourceFile.path}`;
    const targetDir = NodejsPath.dirname(targetPath);
    await fs.promises.mkdir(targetDir, { recursive: true });
    const outputStream = fs.createWriteStream(targetPath);

    return new Promise<void>((resolve, reject) => {
      inputStream.pipe(outputStream);

      outputStream.on('finish', () => {
        resolve();
      });
      outputStream.on('error', (error) => {
        reject(error);
      });
    });
  }

  private fixPath(path: string) {
    return path.replace(/\/+/g, '/');
  }
}
