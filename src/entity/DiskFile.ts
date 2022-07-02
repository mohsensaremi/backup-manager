import { StorageFile } from './StorageFile';
import * as fs from 'fs';

export class DiskFile extends StorageFile {
  stat?: fs.Stats;

  constructor(public readonly path: string, public readonly basePath: string) {
    super(path);
  }

  async size() {
    const stat = await this.getStat();
    return stat.size;
  }

  async createReadableStream(chunkSize?: number) {
    return fs.createReadStream(`${this.basePath}${this.path}`, {
      highWaterMark: chunkSize,
    });
  }

  private async getStat() {
    if (this.stat) {
      return this.stat;
    }
    this.stat = await fs.promises.stat(`${this.basePath}${this.path}`);

    return this.stat;
  }
}
