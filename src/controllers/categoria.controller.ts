// Arquivo: src/controllers/categoria.controller.ts
import type { Request, Response } from 'express';
import { listarCategorias, criarCategoria, atualizarCategoria } from '../services/categoria.service.js';
import { HttpError } from '../lib/http-error.js';

export class CategoriaController {
  // GET /categorias  — qualquer pessoa logada (a tela de novo chamado precisa da lista)
  static async listar(req: Request, res: Response) {
    const incluirInativas = req.query.incluirInativas === 'true';
    // O resultado muda conforme o perfil: só o administrador enxerga as inativas.
    if (incluirInativas && req.user?.perfil !== 'administrador') {
      throw new HttpError(403, 'Apenas administradores veem categorias inativas.');
    }
    res.json(await listarCategorias(incluirInativas));
  }

  // POST /categorias  — administrador
  static async criar(req: Request, res: Response) {
    res.status(201).json(await criarCategoria(req.body.nome));
  }

  // PATCH /categorias/:id  — administrador
  static async atualizar(req: Request, res: Response) {
    const id = Number(req.params.id); // o Zod já garantiu que é um inteiro válido
    res.json(await atualizarCategoria(id, { nome: req.body.nome, ativa: req.body.ativa }));
  }
}