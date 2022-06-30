export abstract class StorageFile {
  constructor(readonly path: string) {}

  async isEqual(other: StorageFile) {
    if (this.path === other.path) {
      const size = this.size();
      const otherSize = other.size();

      return size === otherSize;
    }
    return false;
  }

  abstract size(): Promise<number>;
}
