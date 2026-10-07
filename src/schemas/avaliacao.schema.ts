// Arquivo: src/schemas/avaliacao.schema.ts
import { z } from 'zod';
import { idChamado } from './chamado.schema.js';

// POST /chamados/:id/avaliacao — quem avalia é sempre a pessoa logada (nunca vem do corpo)
export const avaliarChamadoSchema = z.object({
  params: z.object({ id: idChamado }),
  body: z.object({
    nota: z
      .number({ message: 'A nota deve ser um número de 1 a 5.' })
      .int('A nota deve ser um número inteiro.')
      .min(1, 'A nota mínima é 1.')
      .max(5, 'A nota máxima é 5.'),
    comentario: z.string().trim().max(1000, 'Comentário muito longo (máximo 1000).').optional().transform((v) => v || undefined),
  }),
});

// GET /tecnicos/:id/avaliacoes?limite=20  — ":id" é um UUID ou a palavra "me" (o próprio técnico)
export const listarAvaliacoesSchema = z.object({
  params: z.object({
    id: z.union([z.literal('me'), z.string().uuid('ID inválido.')], { message: 'ID inválido.' }),
  }),
  query: z.object({
    limite: z
      .string()
      .regex(/^\d+$/, 'Limite inválido.')
      .refine((v) => Number(v) >= 1 && Number(v) <= 100, 'O limite deve estar entre 1 e 100.')
      .optional(),
  }),
});