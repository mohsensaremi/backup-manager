import { _Object } from '@aws-sdk/client-s3';
import { StorageFile } from './StorageFile';

export class S3File extends StorageFile {
  constructor(readonly storageName: string, readonly obj: _Object) {
    if (!obj.Key) {
      throw new Error('s3 file Key is required');
    }
    super(storageName, obj.Key);
  }

  async size() {
    if (!this.obj.Size) {
      throw new Error('s3 file Size is required');
    }
    return this.obj.Size;
  }
}
