
// Arquivo: src/services/auth.service.ts

import 'temporal-polyfill/full/global';
import 'temporal-polyfill/types/global';

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { db } from '../prisma/db.js';
import { env } from '../config/env.js';
import { HttpError } from '../lib/http-error.js';
import { normalizarEmail, toPublicUser } from './user.service.js';

export const JWT_EMISSOR = 'help-desk-api';
export const JWT_AUDIENCIA = 'help-desk-app';

// Hash "de mentira": quando o e-mail não existe, comparamos mesmo assim,
// para o tempo de resposta não revelar se o e-mail está cadastrado.
const HASH_FALSO = bcrypt.hash('senha-falsa-para-igualar-o-tempo', 12);

// O token carrega só o id (no campo padrão "sub"). O perfil NÃO vai dentro dele:
// o middleware consulta o banco a cada pedido, então aprovar, mudar perfil ou
// desativar alguém vale na hora, sem esperar o token vencer.
function emitirToken(userId: string) {
  return jwt.sign({}, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '60m',
    issuer: JWT_EMISSOR,
    audience: JWT_AUDIENCIA,
    subject: userId,
  });
}

export async function login(emailBruto: string, senha: string) {
  const email = normalizarEmail(emailBruto ?? '');

  const user = await db.orm.public.Usuarios.first({ email });

  const senhaCorreta = await bcrypt.compare(
    senha ?? '',
    user?.senhaHash ?? (await HASH_FALSO),
  );

  if (!user || !senhaCorreta) {
    // Mensagem única: não diga qual dos dois está errado.
    throw new HttpError(401, 'E-mail ou senha incorretos.');
  }

  // Só depois de a senha estar certa é seguro dizer o estado da conta.
  if (user.situacao === 'pendente') {
    throw new HttpError(
      403,
      'Seu cadastro ainda está aguardando aprovação de um administrador.',
    );
  }

  if (user.situacao !== 'ativo') {
    throw new HttpError(
      403,
      'Esta conta não está ativa. Procure um administrador.',
    );
  }

  // Prisma 8 espera Temporal.Instant para campos Timestamptz.
  await db.orm.public.Usuarios.where({ id: user.id }).update({
    ultimoAcesso: Temporal.Now.instant(),
  });

  return {
    token: emitirToken(user.id),
    user: toPublicUser(user),
  };
}

