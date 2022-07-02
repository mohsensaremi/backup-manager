import { GetObjectCommand, S3Client, _Object } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { StorageFile } from './StorageFile';

export class S3File extends StorageFile {
  constructor(
    readonly obj: _Object,
    private readonly bucket: string,
    private readonly s3Client: S3Client,
  ) {
    if (!obj.Key) {
      throw new Error('s3 file Key is required');
    }
    super(obj.Key);
  }

  async size() {
    if (!this.obj.Size) {
      throw new Error('s3 file Size is required');
    }
    return this.obj.Size;
  }

  async createReadableStream() {
    const data = await this.s3Client.send(
      new GetObjectCommand({
        Key: this.path,
        Bucket: this.bucket,
      }),
    );
    return data.Body as Readable;
  }
}
