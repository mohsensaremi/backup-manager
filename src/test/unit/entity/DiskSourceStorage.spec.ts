import * as path from 'path';
import { lastValueFrom, map, toArray } from 'rxjs';
import { DiskStorage } from '../../../repository/DiskStorage';

const rootDir = path.join(__dirname, '../../stubs/directory-tree');

describe('DiskStorage', () => {
  describe('given root dir', () => {
    it('should return files', async () => {
      const obj = new DiskStorage();
      const result = await lastValueFrom(
        obj.files(rootDir).pipe(
          map((s) => s.path),
          toArray(),
        ),
      );

      expect(result).toEqual(
        expect.arrayContaining([
          `${rootDir}/file1.txt`,
          `${rootDir}/dir1/file1.txt`,
          `${rootDir}/dir1/dir1-1/file1.txt`,
          `${rootDir}/dir2/file1.txt`,
          `${rootDir}/dir2/dir2-1/file1.txt`,
        ]),
      );
    });
  });
});
