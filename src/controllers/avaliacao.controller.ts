import type { Request, Response } from 'express';
import { criarAvaliacao } from '../services/avaliacao.service.js';

export const AvaliacaoController = {
  async criar(req: Request, res: Response) {
    const usuario = req.user!;

    const chamadoId = BigInt(String(req.params.id));

    const avaliacao = await criarAvaliacao(
      chamadoId,
      usuario,
      req.body,
    );

    res.status(201).json(avaliacao);
  },
};