// Arquivo: src/middlewares/auth.middleware.ts
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { db } from '../prisma/db.js';
import { HttpError } from '../lib/http-error.js';
import type { Perfil } from '../services/user.service.js';
import { JWT_EMISSOR, JWT_AUDIENCIA } from '../services/auth.service.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const METODOS_SEGUROS = ['GET', 'HEAD', 'OPTIONS'];

// Exige alguém logado e preenche req.user = { id, perfil }.
export async function autenticar(req: Request, _res: Response, next: NextFunction) {
  try {
    // 1. Onde está o token? O cabeçalho Bearer tem prioridade; senão, o cookie.
    const authorization = req.get('authorization');
    let token: string | undefined;
    let viaCookie = false;

    if (authorization !== undefined) {
      const m = /^Bearer ([^\s]+)$/i.exec(authorization);
      if (!m) throw new HttpError(401, 'Cabeçalho Authorization inválido.');
      token = m[1];
    } else if (typeof req.cookies?.token === 'string') {
      token = req.cookies.token;
      viaCookie = true;
    }
    if (!token) throw new HttpError(401, 'Faça login para continuar.');

    // 2. O navegador manda o cookie sozinho, até de outro site (CSRF).
    //    Por isso, pedidos que ALTERAM dados com cookie exigem uma origem confiável.
    if (viaCookie && !METODOS_SEGUROS.includes(req.method)) {
      const origem = req.get('origin') ?? '';
      if (![env.FRONTEND_ORIGIN, env.API_ORIGIN].includes(origem)) {
        throw new HttpError(403, 'Origem não permitida para autenticação por cookie.');
      }
    }

    // 3. O token é verdadeiro? (assinatura, validade, emissor, audiência, algoritmo)
    let id: string;
    try {
      const payload = jwt.verify(token, env.JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: JWT_EMISSOR,
        audience: JWT_AUDIENCIA,
      });
      if (typeof payload === 'string' || typeof payload.sub !== 'string' || !UUID.test(payload.sub)) {
        throw new Error('Payload inválido.');
      }
      id = payload.sub;
    } catch {
      throw new HttpError(401, 'Sessão inválida ou expirada. Faça login novamente.');
    }

    // 4. A pessoa ainda existe e está ativa? O perfil vem do banco, não do token.
    const user = await db.orm.public.Usuarios.first({ id });
    if (!user || user.situacao !== 'ativo' || !user.perfil) {
      throw new HttpError(401, 'Sessão inválida ou expirada. Faça login novamente.');
    }

    req.user = { id: user.id, perfil: user.perfil as Perfil };
    next();
  } catch (err) {
    next(err);
  }
}

// Exige um dos perfis informados. Use sempre DEPOIS de autenticar.
export const exigirPerfil =
  (...perfis: Perfil[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new HttpError(401, 'Faça login para continuar.'));
    if (!perfis.includes(req.user.perfil)) return next(new HttpError(403, 'Você não tem permissão para isso.'));
    next();
  };