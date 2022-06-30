export abstract class StorageFile {
  constructor(readonly storageName: string, readonly path: string) {}

  async isEqual(other: StorageFile) {
    if (this.path === other.path) {
      const size = await this.size();
      const otherSize = await other.size();

      return size === otherSize;
    }
    return false;
  }

  abstract size(): Promise<number>;
}
