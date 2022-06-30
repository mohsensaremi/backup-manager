import {
  HeadObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { EMPTY, Observable } from 'rxjs';
import { S3File } from '../entity/S3File';
import { Readable } from 'stream';
import { DiskFile } from '../entity/DiskFile';
import { StorageFile } from '../entity/StorageFile';
import { Storage } from './Storage';
import { StorageRegistry } from './StorageRegistry';

export class S3Storage implements Storage {
  constructor(
    readonly name: string,
    private readonly registry: StorageRegistry,
    private readonly s3Client: S3Client,
    private readonly bucket: string,
  ) {}

  files(): Observable<DiskFile> {
    return EMPTY;
  }

  async hasFile(file: StorageFile) {
    try {
      await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: file.path,
        }),
      );
      return true;
    } catch (e) {
      if (e.name === 'NotFound') {
        return false;
      }
      throw e;
    }
  }

  async putFile(sourceFile: StorageFile) {
    const readable = await this.registry
      .lookupOrFail(sourceFile)
      .createReadableStream(sourceFile);

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: sourceFile.path,
        Body: readable,
      }),
    );
  }

  async createReadableStream(file: S3File) {
    const data = await this.s3Client.send(
      new GetObjectCommand({
        Key: file.path,
        Bucket: this.bucket,
      }),
    );
    return data.Body as Readable;
  }
}
