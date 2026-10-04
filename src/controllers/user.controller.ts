// Arquivo: src/controllers/user.controller.ts
import type { Request } from 'express';
import type { Response } from 'express';
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  changePassword,
  approveUser,
  deactivateUser,
  type Perfil,
} from '../services/user.service.js';
import { HttpError } from '../lib/http-error.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PERFIS: Perfil[] = ['administrador', 'tecnico', 'usuario'];

// O id dos usuários é UUID (não número).
const readId = (req: Request) => {
  const value = String(req.params.id);
  if (!UUID.test(value)) throw new HttpError(400, 'ID inválido.');
  return value;
};

// Quem está logado (preenchido pelo middleware de autenticação).
const logado = (req: Request) => {
  if (!req.user) throw new HttpError(401, 'Faça login para continuar.');
  return req.user;
};

const exigirAdmin = (req: Request) => {
  const user = logado(req);
  if (user.perfil !== 'administrador') throw new HttpError(403, 'Apenas administradores podem fazer isso.');
  return user;
};

// Lê um campo de texto do corpo: undefined se ausente, erro se não for texto.
const texto = (body: Record<string, unknown>, campo: string, obrigatorio = false) => {
  const valor = body[campo];
  if (valor === undefined || valor === null || valor === '') {
    if (obrigatorio) throw new HttpError(400, `O campo "${campo}" é obrigatório.`);
    return undefined;
  }
  if (typeof valor !== 'string') throw new HttpError(400, `O campo "${campo}" deve ser texto.`);
  return valor;
};

export class UserController {
  // POST /cadastro  (público)
  // Só os campos do formulário. Perfil e situação NUNCA vêm do corpo da requisição.
  static async createUser(req: Request, res: Response) {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const user = await createUser({
      nome: texto(body, 'nome', true)!,
      email: texto(body, 'email', true)!,
      senha: texto(body, 'senha', true)!,
      telefone: texto(body, 'telefone'),
      setor: texto(body, 'setor'),
    });
    res.status(201).json(user); // situacao = "pendente": a tela mostra "aguardando aprovação"
  }

  // GET /usuarios  (administrador)
  static async getAllUsers(req: Request, res: Response) {
    exigirAdmin(req);
    res.json(await getAllUsers());
  }

  // GET /usuarios/:id  (administrador, ou a própria pessoa)
  static async getUserById(req: Request, res: Response) {
    const eu = logado(req);
    const id = readId(req);
    if (eu.perfil !== 'administrador' && eu.id !== id) {
      throw new HttpError(403, 'Você só pode ver o seu próprio cadastro.');
    }
    res.json(await getUserById(id));
  }

  // GET /me  (qualquer pessoa logada)
  static async getMe(req: Request, res: Response) {
    res.json(await getUserById(logado(req).id));
  }

  // PATCH /me  (tela de Perfil) — só nome, telefone e setor.
  // E-mail e perfil são ignorados de propósito.
  static async updateMe(req: Request, res: Response) {
    const body = (req.body ?? {}) as Record<string, unknown>;
    res.json(
      await updateUser(logado(req).id, {
        nome: texto(body, 'nome'),
        telefone: texto(body, 'telefone'),
        setor: texto(body, 'setor'),
      }),
    );
  }

  // PUT /me/senha
  static async changeMyPassword(req: Request, res: Response) {
    const body = (req.body ?? {}) as Record<string, unknown>;
    await changePassword(logado(req).id, texto(body, 'senhaAtual', true)!, texto(body, 'novaSenha', true)!);
    res.status(204).send();
  }

  // POST /usuarios/:id/aprovar  (administrador) — corpo: { "perfil": "tecnico" }
  static async approveUser(req: Request, res: Response) {
    const admin = exigirAdmin(req);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const perfil = texto(body, 'perfil', true) as Perfil;
    if (!PERFIS.includes(perfil)) throw new HttpError(400, 'Perfil inválido.');
    await approveUser(readId(req), perfil, admin.id);
    res.status(204).send();
  }

  // POST /usuarios/:id/desativar  (administrador)
  static async deactivateUser(req: Request, res: Response) {
    const admin = exigirAdmin(req);
    await deactivateUser(readId(req), admin.id);
    res.status(204).send();
  }
}