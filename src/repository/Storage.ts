import { Readable } from 'stream';
import { StorageFile } from '../entity/StorageFile';

export interface Storage {
  name: string;

  filesIterable(): AsyncIterable<StorageFile[]>;

  hasFile(file: StorageFile): Promise<boolean>;

  putFile(file: StorageFile): Promise<void>;

  createReadableStream(file: StorageFile): Promise<Readable>;
}
