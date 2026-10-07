import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';

const pastaUploads = path.resolve('uploads/chamados');

fs.mkdirSync(pastaUploads, { recursive: true });

const tiposPermitidos = new Set([
  'application/pdf',

  'image/png',
  'image/jpeg',

  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

  'text/plain',

  'application/zip',
]);

const armazenamento = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, pastaUploads);
  },

  filename: (_req, file, callback) => {
    const extensao = path.extname(file.originalname);

    const nome = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extensao}`;

    callback(null, nome);
  },
});

export const uploadAnexo = multer({
  storage: armazenamento,

  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 1,
  },

  fileFilter: (_req, file, callback) => {
    if (!tiposPermitidos.has(file.mimetype)) {
      callback(
        new Error(
          'Tipo de arquivo não permitido. Envie PDF, imagem, Word, Excel, TXT ou ZIP.',
        ),
      );

      return;
    }

    callback(null, true);
  },
});