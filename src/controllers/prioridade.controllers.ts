// Arquivo: src/controllers/prioridade.controller.ts
import type { Request, Response } from 'express';
import { listarPrioridades } from '../services/prioridade.service.js';

export class PrioridadeController {
  // GET /prioridades  — qualquer pessoa logada
  static async listar(_req: Request, res: Response) {
    res.json(await listarPrioridades());
  }
}