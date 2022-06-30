import { StorageFile } from '../entity/StorageFile';
import { Storage } from './Storage';

export class StorageRegistry {
  private storages: Record<string, Storage | undefined> = {};

  register(storage: Storage) {
    if (
      this.storages[storage.name] &&
      this.storages[storage.name] !== storage
    ) {
      throw new Error(`duplicate storage name ${storage.name}`);
    }

    this.storages[storage.name] = storage;
  }

  lookup(key: string | StorageFile | Storage) {
    const str =
      typeof key === 'string'
        ? key
        : (key as Storage).name || (key as StorageFile).storageName;
    return this.storages[str];
  }

  lookupOrFail(key: string | StorageFile | Storage) {
    const s = this.lookup(key);
    if (!s) {
      throw new Error(`storage not found ${key}`);
    }

    return s;
  }
}
