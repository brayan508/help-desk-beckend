// Arquivo: src/services/categoria.service.ts
import { db } from '../prisma/db.js';
import { HttpError } from '../lib/http-error.js';

type CategoriaRow = Awaited<ReturnType<typeof db.orm.public.Categorias.create>>;

// Só os campos que a tela precisa.
export const toPublicCategoria = (c: CategoriaRow) => ({ id: c.id, nome: c.nome, ativa: c.ativa });

const igual = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

// Lista as categorias (a tabela é pequena, então filtramos e ordenamos aqui).
export async function listarCategorias(incluirInativas = false) {
  const todas = await db.orm.public.Categorias.all();
  return todas
    .filter((c) => incluirInativas || c.ativa)
    .sort((a, b) => a.id - b.id)
    .map(toPublicCategoria);
}

export async function criarCategoria(nome: string) {
  // O banco só impede nomes IGUAIS; aqui também barramos "rede" quando já existe "Rede".
  const existentes = await db.orm.public.Categorias.all();
  if (existentes.some((c) => igual(c.nome, nome))) {
    throw new HttpError(409, 'Já existe uma categoria com esse nome.');
  }
  try {
    return toPublicCategoria(await db.orm.public.Categorias.create({ nome }));
  } catch (err: any) {
    // duas pessoas criando o mesmo nome ao mesmo tempo
    if (err?.code === 'P2002' || err?.code === '23505') {
      throw new HttpError(409, 'Já existe uma categoria com esse nome.');
    }
    throw err;
  }
}

// Não existe "excluir": os chamados antigos apontam para a categoria.
// Em vez disso, desativa-se (ativa = false) e ela some das listas normais.
export async function atualizarCategoria(id: number, dados: { nome?: string; ativa?: boolean }) {
  const atual = await db.orm.public.Categorias.first({ id });
  if (!atual) throw new HttpError(404, 'Categoria não encontrada.');

  const mudancas: { nome?: string; ativa?: boolean } = {};
  if (dados.nome !== undefined) {
    const existentes = await db.orm.public.Categorias.all();
    if (existentes.some((c) => c.id !== id && igual(c.nome, dados.nome!))) {
      throw new HttpError(409, 'Já existe uma categoria com esse nome.');
    }
    mudancas.nome = dados.nome;
  }
  if (dados.ativa !== undefined) mudancas.ativa = dados.ativa;

  const atualizada = await db.orm.public.Categorias.where({ id }).update(mudancas);
  if (!atualizada) throw new HttpError(404, 'Categoria não encontrada.');
  return toPublicCategoria(atualizada);
}