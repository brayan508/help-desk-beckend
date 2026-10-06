// Arquivo: src/services/prioridade.service.ts
import { db } from '../prisma/db.js';

type PrioridadeRow = Awaited<ReturnType<typeof db.orm.public.Prioridades.create>>;

export const toPublicPrioridade = (p: PrioridadeRow) => ({
  id: p.id,
  nome: p.nome,
  peso: p.peso,
  slaHoras: p.slaHoras,
});

// Da menos urgente (Baixa) para a mais urgente (Alta).
export async function listarPrioridades() {
  const todas = await db.orm.public.Prioridades.all();
  return todas.sort((a, b) => a.peso - b.peso).map(toPublicPrioridade);
}