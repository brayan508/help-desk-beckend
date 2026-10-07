// Arquivo: src/services/avaliacao.service.ts
import { db } from '../prisma/db.js';
import { HttpError } from '../lib/http-error.js';
import { CarregarComAcesso, type Logado } from './chamado.service.js';

type AvaliacaoRow = Awaited<ReturnType<typeof db.orm.public.Avaliacoes.create>>;

const toPublicAvaliacao = (a: AvaliacaoRow) => ({
  chamadoId: Number(a.chamadoId), // BigInt não vira JSON
  nota: a.nota,
  comentario: a.comentario ?? null,
  criadoEm: a.criadoEm,
});

// Quem abriu o chamado avalia o atendimento: só depois de resolvido, e uma única vez.
export async function avaliarChamado(id: bigint, u: Logado, dados: { nota: number; comentario?: string }) {
  const c = await CarregarComAcesso(id, u); // 404 se a pessoa não tem relação com o chamado
  if (c.solicitanteId !== u.id) throw new HttpError(403, 'Só quem abriu o chamado pode avaliar o atendimento.');
  if (c.status !== 'resolvido') throw new HttpError(409, 'Só dá para avaliar chamados resolvidos.');
  if (await db.orm.public.Avaliacoes.first({ chamadoId: c.id })) {
    throw new HttpError(409, 'Este chamado já foi avaliado.');
  }
  try {
    return toPublicAvaliacao(
      await db.orm.public.Avaliacoes.create({
        chamadoId: c.id,
        avaliadorId: u.id,
        nota: dados.nota,
        comentario: dados.comentario ?? null,
      }),
    );
  } catch (err: any) {
    // duas avaliações ao mesmo tempo: a chave primária (chamado_id) barra a segunda
    if (err?.code === 'P2002' || err?.code === '23505') throw new HttpError(409, 'Este chamado já foi avaliado.');
    throw err;
  }
}

const arredondar = (n: number) => Math.round(n * 10) / 10;

// O que acharam do atendimento de UM técnico (tela de Perfil e Histórico do técnico).
export async function listarAvaliacoesDoTecnico(tecnicoId: string, u: Logado, limite = 50) {
  if (u.perfil === 'usuario') throw new HttpError(403, 'Você não tem permissão para ver avaliações.');
  if (u.perfil === 'tecnico' && tecnicoId !== u.id) throw new HttpError(403, 'Você só pode ver as suas próprias avaliações.');

  const tecnico = await db.orm.public.Usuarios.first({ id: tecnicoId });
  if (!tecnico || tecnico.perfil !== 'tecnico') throw new HttpError(404, 'Técnico não encontrado.');

  // Os chamados que ele resolveu (um chamado resolvido nunca troca de técnico).
  const resolvidos = (await db.orm.public.Chamados.where({ tecnicoId }).all()).filter((c) => c.status === 'resolvido');
  const chamadoPorId = new Map(resolvidos.map((c) => [String(c.id), c] as const));

  const avaliacoes = (await db.orm.public.Avaliacoes.all())
    .filter((a) => chamadoPorId.has(String(a.chamadoId)))
    .sort((a, b) => b.criadoEm.epochMilliseconds - a.criadoEm.epochMilliseconds); // mais recentes primeiro

  // Resumo (calculado sobre TODAS as avaliações, não só as devolvidas na página)
  const distribuicao: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
  let soma = 0;
  for (const a of avaliacoes) {
    distribuicao[String(a.nota)] += 1;
    soma += a.nota;
  }

  const nomes = new Map((await db.orm.public.Usuarios.all()).map((p) => [p.id, p.nome] as const));
  return {
    tecnico: { id: tecnico.id, nome: tecnico.nome },
    resumo: {
      resolvidos: resolvidos.length,
      avaliados: avaliacoes.length,
      media: avaliacoes.length ? arredondar(soma / avaliacoes.length) : null, // sem avaliações: null, não 0
      distribuicao,
    },
    avaliacoes: avaliacoes.slice(0, limite).map((a) => {
      const chamado = chamadoPorId.get(String(a.chamadoId))!;
      return {
        chamado: { id: Number(chamado.id), titulo: chamado.titulo },
        nota: a.nota,
        comentario: a.comentario ?? null,
        solicitante: nomes.get(a.avaliadorId) ?? 'Usuário removido', // se preferir anonimato, troque por null
        criadoEm: a.criadoEm,
      };
    }),
  };
}