import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { EMPTY, Observable } from 'rxjs';
import { DiskFile } from '../entity/DiskFile';
import { ReadableStreamFactory } from '../entity/ReadableStreamFactory';
import { StorageFile } from '../entity/StorageFile';
import { Storage } from './Storage';

export class S3Storage implements Storage {
  constructor(
    private readonly s3Client: S3Client,
    private readonly readableStreamFactory: ReadableStreamFactory,
  ) {}

  files(basePath: string): Observable<DiskFile> {
    return EMPTY;
  }

  async hasFile(file: StorageFile) {
    const response = await this.s3Client.send(
      new HeadObjectCommand({
        Bucket: 'karnaval-backup',
        Key: file.path,
      }),
    );
    console.log('Success', response);
    return !!response;
  }

  async putFile(sourceFile: StorageFile) {
    const readable = await this.readableStreamFactory.createReadStream(
      sourceFile,
    );

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: 'karnaval-backup',
        Key: sourceFile.path,
        Body: readable,
      }),
    );
  }
}
