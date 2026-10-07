// Arquivo: src/controllers/avaliacao.controller.ts
import type { Request, Response } from 'express';
import { avaliarChamado, listarAvaliacoesDoTecnico } from '../services/avaliacao.service.js';
import { HttpError } from '../lib/http-error.js';

const logado = (req: Request) => {
  if (!req.user) throw new HttpError(401, 'Faça login para continuar.');
  return req.user;
};

export class AvaliacaoController {
  // POST /chamados/:id/avaliacao  — quem abriu o chamado
  static async avaliar(req: Request, res: Response) {
    res.status(201).json(await avaliarChamado(BigInt(String(req.params.id)), logado(req), req.body));
  }

  // GET /tecnicos/:id/avaliacoes  — o próprio técnico ("me") ou o administrador
  static async listarDoTecnico(req: Request, res: Response) {
    const u = logado(req);
    const alvo = req.params.id === 'me' ? u.id : String(req.params.id);
    const limite = req.query.limite ? Number(req.query.limite) : 50;
    res.json(await listarAvaliacoesDoTecnico(alvo, u, limite));
  }
}