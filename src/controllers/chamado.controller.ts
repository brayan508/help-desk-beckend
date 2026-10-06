// Arquivo: src/controllers/chamado.controller.ts
import type { Request, Response } from 'express';
import {
  criarChamado, listarChamados, buscarChamado, atribuirChamado, iniciarChamado,
  devolverChamado, resolverChamado, cancelarChamado, alterarPrioridade,
  type Escopo, type StatusChamado,
} from '../services/chamado.service.js';
import { HttpError } from '../lib/http-error.js';

const logado = (req: Request) => {
  if (!req.user) throw new HttpError(401, 'Faça login para continuar.');
  return req.user;
};

// O Zod já garantiu que o :id é um inteiro positivo válido.
const idDaRota = (req: Request) => BigInt(String(req.params.id));

export class ChamadoController {
  // POST /chamados
  static async criar(req: Request, res: Response) {
    res.status(201).json(await criarChamado(logado(req), req.body));
  }

  // GET /chamados?escopo=&status=
  static async listar(req: Request, res: Response) {
    res.json(
      await listarChamados(logado(req), {
        escopo: req.query.escopo as Escopo | undefined,
        status: req.query.status as StatusChamado | undefined,
      }),
    );
  }

  // GET /chamados/:id
  static async buscar(req: Request, res: Response) {
    res.json(await buscarChamado(idDaRota(req), logado(req)));
  }

  // POST /chamados/:id/atribuir  — administrador
  static async atribuir(req: Request, res: Response) {
    res.json(await atribuirChamado(idDaRota(req), req.body.tecnicoId, logado(req)));
  }

  // POST /chamados/:id/iniciar  — técnico atribuído
  static async iniciar(req: Request, res: Response) {
    res.json(await iniciarChamado(idDaRota(req), logado(req)));
  }

  // POST /chamados/:id/devolver  — técnico atribuído
  static async devolver(req: Request, res: Response) {
    res.json(await devolverChamado(idDaRota(req), logado(req), req.body?.motivo));
  }

  // POST /chamados/:id/resolver  — técnico atribuído
  static async resolver(req: Request, res: Response) {
    res.json(await resolverChamado(idDaRota(req), logado(req), req.body.solucao));
  }

  // POST /chamados/:id/cancelar  — quem abriu
  static async cancelar(req: Request, res: Response) {
    res.json(await cancelarChamado(idDaRota(req), logado(req)));
  }

  // PATCH /chamados/:id/prioridade  — administrador
  static async alterarPrioridade(req: Request, res: Response) {
    res.json(await alterarPrioridade(idDaRota(req), req.body.prioridadeId, logado(req)));
  }
}