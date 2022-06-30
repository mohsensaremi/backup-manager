import * as fs from 'fs';
import * as NodejsPath from 'path';
import { concatMap, filter, from, map, Observable, of } from 'rxjs';
import { DiskFile } from '../entity/DiskFile';
import { StorageFile } from '../entity/StorageFile';
import { Storage } from './Storage';
import { StorageRegistry } from './StorageRegistry';

export class DiskStorage implements Storage {
  constructor(
    readonly name: string,
    private readonly registry: StorageRegistry,
    private readonly basePath: string,
  ) {}

  files(): Observable<DiskFile> {
    return this.listFiles(this.basePath).pipe(
      map(
        (path) =>
          new DiskFile(
            this.name,
            path.replace(this.basePath, ''),
            this.basePath,
          ),
      ),
    );
  }

  async hasFile(file: StorageFile) {
    try {
      await fs.promises.access(`${this.basePath}${file.path}`);
      const otherFile = new DiskFile(this.name, file.path, this.basePath);
      return otherFile.isEqual(file);
    } catch {}
    return false;
  }

  async putFile(sourceFile: StorageFile) {
    const inputStream = await this.registry
      .lookupOrFail(sourceFile)
      .createReadableStream(sourceFile);

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

  async createReadableStream(file: DiskFile) {
    return fs.createReadStream(`${this.basePath}${file.path}`);
  }

  private listFiles(path: string): Observable<string> {
    const filesInDir = (path: string) => from(fs.promises.readdir(path));
    const statFile = (path: string) => from(fs.promises.stat(path));

    return filesInDir(path).pipe(
      concatMap((file) => from(file)),
      filter((file) => !file.startsWith('.')),
      concatMap((file) =>
        statFile(this.fixPath(`${path}/${file}`)).pipe(
          map((sf) => {
            return { file, isDir: sf.isDirectory() };
          }),
        ),
      ),
      concatMap((f) => {
        if (f.isDir) {
          return this.listFiles(this.fixPath(`${path}/${f.file}`));
        }
        return of(this.fixPath(`${path}/${f.file}`));
      }),
    );
  }

  private fixPath(path: string) {
    return path.replace(/\/+/g, '/');
  }
}
