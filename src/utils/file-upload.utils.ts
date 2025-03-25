import { HttpException, HttpStatus } from '@nestjs/common';
import { extname } from 'path';

export const allowedImageExtensions = ['.jpg', '.jpeg', '.png'];
export const allowedDocumentExtensions = ['.pdf'];
export const allowedArchiveExtensions = ['.zip'];

export const fileFilter = (allowedExtensions: string[]) => {
  return (req, file, callback) => {
    const ext = extname(file.originalname.toLowerCase());
    if (allowedExtensions.includes(ext)) {
      return callback(null, true);
    }
    return callback(
      new HttpException(
        `Unsupported file type. Allowed extensions: ${allowedExtensions.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      ),
      false,
    );
  };
};

export const imageFileFilter = fileFilter(allowedImageExtensions);
export const documentFileFilter = fileFilter(allowedDocumentExtensions);
export const archiveFileFilter = fileFilter(allowedArchiveExtensions);

export const editFileName = (req, file, callback) => {
  const fileExtName = extname(file.originalname);
  const randomName = Array(16)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');
  callback(null, `${randomName}${fileExtName}`);
};
