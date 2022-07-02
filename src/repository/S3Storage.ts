import {
  CompleteMultipartUploadCommand,
  CompleteMultipartUploadCommandInput,
  CreateMultipartUploadCommand,
  HeadObjectCommand,
  ListObjectsCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
  UploadPartCommandInput,
} from '@aws-sdk/client-s3';
import { S3File } from '../entity/S3File';
import { StorageFile } from '../entity/StorageFile';
import { Storage } from './Storage';
import * as stream from 'stream';
import { LogService } from '../log.service';

export class S3Storage implements Storage {
  constructor(
    private readonly s3Client: S3Client,
    private readonly bucket: string,
    private readonly logService: LogService,
  ) {}

  filesIterable(): AsyncIterable<S3File[]> {
    let marker: string | undefined = undefined;
    const asyncIterator: AsyncIterator<S3File[]> = {
      next: async () => {
        const response = await this.s3Client.send(
          new ListObjectsCommand({
            Bucket: this.bucket,
            Marker: marker,
          }),
        );
        if (response.Contents) {
          marker = response.Contents[response.Contents.length - 1].Key;
          const files = response.Contents.map(
            (obj) => new S3File(obj, this.bucket, this.s3Client),
          );
          return { done: false, value: files };
        } else {
          return { done: true, value: undefined };
        }
      },
    };

    return {
      [Symbol.asyncIterator]: () => asyncIterator,
    };
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
    const size = await sourceFile.size();
    // 400 MB
    if (size < 1024 * 1024 * 400) {
      const readable = await sourceFile.createReadableStream();

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: sourceFile.path,
          Body: readable,
        }),
      );
    } else {
      this.putMultipartFile(sourceFile);
    }
  }

  private async putMultipartFile(sourceFile: StorageFile) {
    const s3 = this.s3Client;
    const { logService, bucket } = this;

    const createMultipartUploadCommandOutput = await s3.send(
      new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: sourceFile.path,
      }),
    );

    const chunkSize = 1024 * 1024 * 10; // 10MB
    const readable = await sourceFile.createReadableStream(chunkSize);
    let writeIndex = 0;
    const Parts: Array<{
      ETag?: string;
      PartNumber: number;
    }> = [];
    const writable = new stream.Writable({
      write(chunk, encoding, next) {
        (async () => {
          try {
            const PartNumber = writeIndex + 1;
            logService.debug(
              `sending multipart chunk ${PartNumber} (${sourceFile.path})`,
              'S3Storage',
            );

            const uploadPartResponse = await s3.send(
              new UploadPartCommand({
                Body: chunk,
                Bucket: bucket,
                Key: sourceFile.path,
                PartNumber: PartNumber,
                UploadId: createMultipartUploadCommandOutput.UploadId,
              }),
            );

            logService.debug(
              `multipart chunk ${PartNumber} uploaded (${sourceFile.path})`,
              'S3Storage',
            );

            Parts[PartNumber - 1] = {
              ETag: uploadPartResponse.ETag,
              PartNumber: PartNumber,
            };

            await s3.send(
              new CompleteMultipartUploadCommand({
                Bucket: bucket,
                Key: sourceFile.path,
                MultipartUpload: {
                  Parts,
                },
                UploadId: createMultipartUploadCommandOutput.UploadId,
              }),
            );

            logService.debug(
              `multipart chunk ${PartNumber} completed (${sourceFile.path})`,
              'S3Storage',
            );

            writeIndex++;
            next();
          } catch (e) {
            next(e);
          }
        })();
      },
    });

    return new Promise<void>((resolve, reject) => {
      const pipe = readable.pipe(writable);

      pipe.on('finish', () => {
        resolve();
      });
      pipe.on('error', (error) => {
        reject(error);
      });
    });
  }
}
