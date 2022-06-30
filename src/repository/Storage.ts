import { Observable } from 'rxjs';
import { StorageFile } from '../entity/StorageFile';

export interface Storage {
  files(path: string): Observable<StorageFile>;

  hasFile(file: StorageFile): Promise<boolean>;

  putFile(file: StorageFile): Promise<void>;
}
