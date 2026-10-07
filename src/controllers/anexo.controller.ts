import type { Request, Response } from 'express';
import { criarAnexo } from '../services/anexo.service.js';

export const AnexoController = {
  async criar(req: Request, res: Response) {
    const usuario = req.user!;

    const chamadoId = BigInt(String(req.params.id));

    const arquivo = req.file;

    if (!arquivo) {
      res.status(400).json({
        error: 'Nenhum arquivo foi enviado.',
      });
      return;
    }

    const anexo = await criarAnexo(
      chamadoId,
      usuario,
      arquivo,
    );

    res.status(201).json(anexo);
  },
};