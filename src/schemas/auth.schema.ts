// Arquivo: src/schemas/auth.schema.ts
import { z } from 'zod';

// POST /login
export const loginSchema = z.object({
  body: z
    .object({
      email: z.string().trim().toLowerCase().max(254).pipe(z.email('E-mail inválido.')),
      // o bcrypt só considera os primeiros 72 bytes: senhas maiores nunca são aceitas
      senha: z.string().min(1, 'Informe a senha.').refine((v) => Buffer.byteLength(v, 'utf8') <= 72, 'Senha muito longa.'),
    })
    .strict(), // campos extras no corpo geram 400
});