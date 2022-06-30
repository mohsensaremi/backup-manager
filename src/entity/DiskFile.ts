import { StorageFile } from './StorageFile';
import * as fs from 'fs';

export class DiskFile extends StorageFile {
  stat?: fs.Stats;

  constructor(public readonly path: string) {
    super(path);
  }

  async size() {
    const stat = await this.getStat();
    return stat.size;
  }

  private async getStat() {
    if (this.stat) {
      return this.stat;
    }
    this.stat = await fs.promises.stat(this.path);

    return this.stat;
  }
}
