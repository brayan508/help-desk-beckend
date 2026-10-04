// Arquivo: src/controllers/auth.controller.ts
import type { Request, Response } from 'express';
import { login } from '../services/auth.service.js';
import { env } from '../config/env.js';
import { HttpError } from '../lib/http-error.js';

// httpOnly: o JavaScript da página não consegue ler o cookie (protege contra roubo por XSS).
// sameSite 'lax': o navegador não manda o cookie em pedidos disparados por outros sites.
const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production', // em produção só trafega por HTTPS
  sameSite: 'lax' as const,
  path: '/',
};

export class AuthController {
  // POST /login — corpo: { "email": "...", "senha": "..." }
  static async login(req: Request, res: Response) {
    const { email, senha } = (req.body ?? {}) as Record<string, unknown>;
    if (typeof email !== 'string' || typeof senha !== 'string') {
      throw new HttpError(400, 'Informe e-mail e senha.');
    }
    const { token, user } = await login(email, senha);

    // Duas formas de usar o token: o cookie (o navegador reenvia sozinho)
    // ou o próprio token no cabeçalho "Authorization: Bearer ..." (Thunder Client, curl, apps).
    res.cookie('token', token, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.json({ token, user }); // "user" inclui o perfil: a tela escolhe o destino por ele
  }

  // POST /logout — limpa o cookie. Um token Bearer já emitido continua válido até vencer (15 min).
  static logout(_req: Request, res: Response) {
    res.clearCookie('token', cookieOptions);
    res.status(204).send();
  }
}