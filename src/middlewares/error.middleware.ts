// Arquivo: src/middlewares/error.middleware.ts

import type { ErrorRequestHandler } from 'express';
import multer from 'multer';

import { HttpError } from '../lib/http-error.js';
import { logger } from '../config/logger.js';

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  next,
) => {
  if (res.headersSent) {
    return next(error);
  }

  // Erros controlados pela aplicação
  if (error instanceof HttpError) {
    res.status(error.status).json({
      error: error.message,
    });

    return;
  }

  // Erros do Multer
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        error: 'Arquivo muito grande. O limite é de 10 MB.',
      });

      return;
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({
        error: 'Apenas um arquivo pode ser enviado por vez.',
      });

      return;
    }

    res.status(400).json({
      error: 'Erro ao enviar o arquivo.',
    });

    return;
  }

  // Tipo de arquivo não permitido
  if (
    error instanceof Error &&
    error.message.startsWith('Tipo de arquivo não permitido')
  ) {
    res.status(415).json({
      error: error.message,
    });

    return;
  }

  // Erro de violação de chave única do PostgreSQL
  if (
    typeof error === 'object' &&
    error !== null &&
    'sqlState' in error &&
    error.sqlState === '23505'
  ) {
    res.status(409).json({
      error: 'Este e-mail já está em uso.',
    });

    return;
  }

  // Erros conhecidos do Express
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error
  ) {
    if (error.status === 400) {
      res.status(400).json({
        error: 'JSON inválido.',
      });

      return;
    }

    if (error.status === 413) {
      res.status(413).json({
        error: 'Corpo da requisição muito grande.',
      });

      return;
    }
  }

  // Erros não tratados
  logger.error('Erro interno na API.', {
    errorType: error instanceof Error ? error.name : 'unknown',

    sqlState:
      typeof error === 'object' &&
      error !== null &&
      'sqlState' in error
        ? error.sqlState
        : undefined,
  });

  res.status(500).json({
    error: 'Erro interno do servidor.',
  });
};