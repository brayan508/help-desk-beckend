// Arquivo: src/schemas/user.schema.ts
import { z } from 'zod';

// ---------- Peças reutilizáveis ----------
const nome = z.string().trim().min(2, 'Informe o nome completo.').max(120, 'Nome muito longo.');

// O banco exige e-mail em minúsculas: o Zod já normaliza antes de chegar ao serviço.
const email = z.string().trim().toLowerCase().email('E-mail inválido.').max(254, 'E-mail muito longo.');

// Mínimo 8 caracteres; o bcrypt só considera os primeiros 72 bytes.
const senhaNova = z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres.').max(72, 'A senha pode ter no máximo 72 caracteres.');

// Campo opcional: texto vazio vira "não informado".
const textoOpcional = (max: number) =>
  z.string().trim().max(max, `Máximo de ${max} caracteres.`).optional().transform((v) => v || undefined);

const id = z.string().uuid('ID inválido.');
const perfil = z.enum(['administrador', 'tecnico', 'usuario'], { message: 'Perfil inválido.' });

// ---------- Schemas (cada um valida { body, params, query }) ----------

// POST /cadastro — só estes campos. "perfil" e "situacao" não existem aqui de propósito:
// qualquer coisa a mais enviada pelo cliente é descartada.
export const cadastroSchema = z.object({
  body: z.object({
    nome,
    email,
    senha: senhaNova,
    telefone: textoOpcional(30),
    setor: textoOpcional(80),
  }),
});

// PATCH /me — tela de Perfil. E-mail e perfil não podem ser alterados aqui.
export const atualizarPerfilSchema = z.object({
  body: z
    .object({
      nome: nome.optional(),
      telefone: textoOpcional(30),
      setor: textoOpcional(80),
    })
    .refine((b) => Object.values(b).some((v) => v !== undefined), { message: 'Informe pelo menos um campo.' }),
});

// PUT /me/senha
export const trocarSenhaSchema = z.object({
  body: z.object({
    senhaAtual: z.string().min(1, 'Informe a senha atual.'),
    novaSenha: senhaNova,
  }),
});

// GET /usuarios/:id e POST /usuarios/:id/desativar
export const userIdSchema = z.object({
  params: z.object({ id }),
});

// POST /usuarios/:id/aprovar
export const aprovarSchema = z.object({
  params: z.object({ id }),
  body: z.object({ perfil }),
});