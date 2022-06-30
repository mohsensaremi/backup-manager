import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import { Readable } from 'stream';
import { DiskFile } from './DiskFile';
import { S3File } from './S3File';
import { StorageFile } from './StorageFile';

export class ReadableStreamFactory {
  constructor(private readonly s3Client: S3Client) {}

  async createReadStream(file: StorageFile): Promise<Readable> {
    if (file instanceof DiskFile) {
      return this.createDiskFileReadStream(file);
    } else if (file instanceof S3File) {
      return this.createS3FileReadStream(file);
    }
    throw Error(`invalid file ${file.constructor.name}`);
  }

  private async createS3FileReadStream(file: S3File) {
    const data = await this.s3Client.send(
      new GetObjectCommand({
        Key: file.path,
        Bucket: 'karnaval-backup',
      }),
    );
    return data.Body as Readable;
  }

  private async createDiskFileReadStream(file: DiskFile) {
    return fs.createReadStream(file.path);
  }
}
