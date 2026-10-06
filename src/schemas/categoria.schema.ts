import {z} from 'zod';

// O id de categorias é SmallInt (número de 1 a 32767), não UUID como o de usuários.
// Na URL ele chega como texto: aqui só conferimos o formato; o controller converte.


const id = z
.string()
.regex(/^\d+$/, 'ID inválido.')
.refine((v) => Number(v) > 1 && Number(v) < 32767, 'ID inválido.');

const nome = z
.string()
.trim()
.min(2, 'o nome precisa ter no mínimo 2 caracteres.')
.max(60, 'o nome precisa ter no máximo 60 caracteres.');


// GET /categorias?incluirInativas=true

export const listarCategoriasSchema = z.object({
  query: z.object({
    incluirInativas: z.enum(['true', 'false'], { message: 'Use true ou false.' }).optional(),
  }),
});

// POST /categorias
export const criarCategoriaSchema = z.object({
  body: z.object({ nome }),
});

// PATCH /categorias/:id — nome e/ou ativa, pelo menos um
export const atualizarCategoriaSchema = z.object({
  params: z.object({ id }),
  body: z
    .object({
      nome: nome.optional(),
      ativa: z.boolean({ message: 'O campo "ativa" deve ser true ou false.' }).optional(),
    })
    .refine((b) => b.nome !== undefined || b.ativa !== undefined, { message: 'Informe pelo menos um campo.' }),
});
