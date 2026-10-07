import { db } from "../prisma/db.js";
import { HttpError } from "../lib/http-error.js";

type Logado = {
    id: string;
      perfil: 'administrador' | 'tecnico' | 'usuario';
};

export interface CriarAvaliacaoInput {
  nota: number;
  comentario?: string;
}

export async function criarAvaliacao(
  chamadoId: bigint,
  usuario: Logado,
  dados: CriarAvaliacaoInput,
) {
  const chamado = await db.orm.public.Chamados.first({
    id: chamadoId,
  });

  if (!chamado) {
    throw new HttpError(404, 'Chamado não encontrado.');
  }

  if (chamado.status !== 'resolvido') {
    throw new HttpError(
      409,
      'Só é possível avaliar chamados resolvidos.',
    );
  }

  if (chamado.solicitanteId !== usuario.id) {
    throw new HttpError(
      403,
      'Apenas o solicitante pode avaliar este chamado.',
    );
  }

  const avaliacaoExistente =
    await db.orm.public.Avaliacoes.first({
      chamadoId,
    });

  if (avaliacaoExistente) {
    throw new HttpError(
      409,
      'Este chamado já foi avaliado.',
    );
  }

  const avaliacao = await db.orm.public.Avaliacoes.create({
    chamadoId,
    avaliadorId: usuario.id,
    nota: dados.nota,
    comentario: dados.comentario ?? null,
  });

  return {
    chamadoId: Number(avaliacao.chamadoId),
    avaliadorId: avaliacao.avaliadorId,
    nota: avaliacao.nota,
    comentario: avaliacao.comentario,
    criadoEm: avaliacao.criadoEm,
  };
}