import * as fs from 'fs';
import * as NodejsPath from 'path';
import { concatMap, filter, from, map, Observable, of } from 'rxjs';
import { ReadableStreamFactory } from '../entity/ReadableStreamFactory';
import { Storage } from './Storage';
import { StorageFile } from '../entity/StorageFile';
import { DiskFile } from '../entity/DiskFile';

export class DiskStorage implements Storage {
  constructor(private readonly readableStreamFactory: ReadableStreamFactory) {}

  files(basePath: string): Observable<DiskFile> {
    return this.listFiles(basePath).pipe(map((path) => new DiskFile(path)));
  }

  async hasFile(file: StorageFile) {
    try {
      await fs.promises.access(file.path);
      const otherFile = new DiskFile(file.path);
      return otherFile.isEqual(file);
    } catch {}
    return false;
  }

  async putFile(sourceFile: StorageFile) {
    const inputStream = await this.readableStreamFactory.createReadStream(
      sourceFile,
    );

    const dir = NodejsPath.dirname(sourceFile.path);
    await fs.promises.mkdir(dir, { recursive: true });
    const outputStream = fs.createWriteStream(sourceFile.path);

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

  private listFiles(path: string): Observable<string> {
    const filesInDir = (path: string) => from(fs.promises.readdir(path));
    const statFile = (path: string) => from(fs.promises.stat(path));

    return filesInDir(path).pipe(
      concatMap((file) => from(file)),
      filter((file) => !file.startsWith('.')),
      concatMap((file) =>
        statFile(`${path}/${file}`).pipe(
          map((sf) => {
            return { file, isDir: sf.isDirectory() };
          }),
        ),
      ),
      concatMap((f) => {
        if (f.isDir) {
          return this.listFiles(`${path}/${f.file}`);
        }
        return of(`${path}/${f.file}`);
      }),
    );
  }
}
