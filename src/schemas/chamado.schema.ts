// Arquivo: src/schemas/chamado.schema.ts
import { z } from 'zod';

// O id de chamados é BigInt. Na URL chega como texto: conferimos que é um inteiro
// positivo dentro do limite do bigint do PostgreSQL; o controller converte para BigInt.
const MAX_BIGINT = BigInt('9223372036854775807');
const idChamado = z.string().refine((v) => {
  // Tudo numa só conferência: no Zod 4 as conferências seguintes ainda rodam depois de uma
  // falha, e BigInt('abc') lança exceção (daria erro 500 em vez de 400).
  if (!/^\d{1,19}$/.test(v)) return false;
  const n = BigInt(v);
  return n >= BigInt(1) && n <= MAX_BIGINT;
}, 'ID inválido.');

const smallint = (mensagem: string) => z.number({ message: mensagem }).int(mensagem).min(1, mensagem).max(32767, mensagem);
const uuid = z.string().uuid('ID inválido.');
const STATUS = ['aberto', 'em_andamento', 'resolvido', 'cancelado'] as const;

// POST /chamados — quem abre é sempre a pessoa logada (nunca vem do corpo)
export const criarChamadoSchema = z.object({
  body: z.object({
    titulo: z.string().trim().min(3, 'O assunto precisa ter pelo menos 3 caracteres.').max(150, 'Assunto muito longo (máximo 150).'),
    descricao: z.string().trim().min(5, 'Descreva o problema com pelo menos 5 caracteres.').max(5000, 'Descrição muito longa (máximo 5000).'),
    categoriaId: smallint('Categoria inválida.'),
    prioridadeId: smallint('Prioridade inválida.'),
  }),
});

// GET /chamados?escopo=...&status=...
export const listarChamadosSchema = z.object({
  query: z.object({
    escopo: z.enum(['solicitados', 'atribuidos', 'todos', 'sem-tecnico'], { message: 'Escopo inválido.' }).optional(),
    status: z.enum(STATUS, { message: 'Status inválido.' }).optional(),
  }),
});

// GET /chamados/:id, POST /chamados/:id/iniciar, POST /chamados/:id/cancelar
export const idChamadoSchema = z.object({ params: z.object({ id: idChamado }) });

// POST /chamados/:id/atribuir
export const atribuirChamadoSchema = z.object({
  params: z.object({ id: idChamado }),
  body: z.object({ tecnicoId: uuid }),
});

// POST /chamados/:id/devolver
export const devolverChamadoSchema = z.object({
  params: z.object({ id: idChamado }),
  body: z.object({ motivo: z.string().trim().max(500, 'Motivo muito longo (máximo 500).').optional() }).optional().default({}),
});

// POST /chamados/:id/resolver
export const resolverChamadoSchema = z.object({
  params: z.object({ id: idChamado }),
  body: z.object({
    solucao: z.string().trim().min(5, 'Descreva a solução aplicada (mínimo 5 caracteres).').max(5000, 'Solução muito longa (máximo 5000).'),
  }),
});

// PATCH /chamados/:id/prioridade
export const alterarPrioridadeSchema = z.object({
  params: z.object({ id: idChamado }),
  body: z.object({ prioridadeId: smallint('Prioridade inválida.') }),
});