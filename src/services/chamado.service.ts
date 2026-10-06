// Arquivo: src/services/chamado.service.ts

import 'temporal-polyfill/full/global';
import 'temporal-polyfill/types/global';

import { db } from '../prisma/db.js';
import { HttpError } from '../lib/http-error.js';
import type { Perfil } from './user.service.js';

export type Logado = {
  id: string;
  perfil: Perfil;
};

export type StatusChamado =
  | 'aberto'
  | 'em_andamento'
  | 'resolvido'
  | 'cancelado';

export type Escopo =
  | 'solicitados'
  | 'atribuidos'
  | 'todos'
  | 'sem-tecnico';

type TipoEvento =
  | 'criado'
  | 'atribuido'
  | 'devolvido'
  | 'iniciado'
  | 'prioridade_alterada'
  | 'resolvido'
  | 'cancelado'
  | 'reaberto';

type ChamadoRow =
  Awaited<ReturnType<typeof db.orm.public.Chamados.create>>;

// ============================================================
// Datas
// ============================================================

const agora = () => Temporal.Now.instant();

const tempo = (
  d: Temporal.Instant | Date | string | null | undefined,
) => {
  if (!d) return Infinity;

  if (d instanceof Date) {
    return d.getTime();
  }

  if (typeof d === 'string') {
    return new Date(d).getTime();
  }

  return Number(d.epochMilliseconds);
};

// ============================================================
// Montar a resposta: nomes no lugar de IDs soltos
// ============================================================

async function carregarContexto() {
  const [categorias, prioridades, usuarios] = await Promise.all([
    db.orm.public.Categorias.all(),
    db.orm.public.Prioridades.all(),
    db.orm.public.Usuarios.all(),
  ]);

  return {
    categoria: new Map(
      categorias.map((c) => [c.id, c] as const),
    ),

    prioridade: new Map(
      prioridades.map((p) => [p.id, p] as const),
    ),

    usuario: new Map(
      usuarios.map((u) => [u.id, u] as const),
    ),
  };
}

type Contexto = Awaited<ReturnType<typeof carregarContexto>>;

function pessoa(
  ctx: Contexto,
  id: string | null | undefined,
) {
  if (!id) return null;

  return {
    id,
    nome: ctx.usuario.get(id)?.nome ?? 'Usuário removido',
  };
}

function toPublicChamado(
  c: ChamadoRow,
  ctx: Contexto,
) {
  const categoria = ctx.categoria.get(c.categoriaId);
  const prioridade = ctx.prioridade.get(c.prioridadeId);

  const emAberto =
    c.status === 'aberto' ||
    c.status === 'em_andamento';

  return {
    id: Number(c.id),

    titulo: c.titulo,

    descricao: c.descricao,

    status: c.status,

    categoria: {
      id: c.categoriaId,
      nome: categoria?.nome ?? '—',
    },

    prioridade: {
      id: c.prioridadeId,
      nome: prioridade?.nome ?? '—',
      slaHoras: prioridade?.slaHoras ?? null,
    },

    solicitante: pessoa(
      ctx,
      c.solicitanteId,
    ),

    tecnico: pessoa(
      ctx,
      c.tecnicoId,
    ),

    solucao: c.solucao ?? null,

    prazoSla: c.prazoSla ?? null,

    slaVencido:
      emAberto &&
      !!c.prazoSla &&
      tempo(c.prazoSla) < Date.now(),

    criadoEm: c.criadoEm,

    atribuidoEm: c.atribuidoEm ?? null,

    iniciadoEm: c.iniciadoEm ?? null,

    resolvidoEm: c.resolvidoEm ?? null,
  };
}

// ============================================================
// Permissão POR REGISTRO
// ============================================================

async function carregar(id: bigint) {
  const c = await db.orm.public.Chamados.first({ id });

  if (!c) {
    throw new HttpError(
      404,
      'Chamado não encontrado.',
    );
  }

  return c;
}

const participa = (
  c: ChamadoRow,
  u: Logado,
) =>
  u.perfil === 'administrador' ||
  c.solicitanteId === u.id ||
  c.tecnicoId === u.id;

// Quem não tem NENHUMA relação com o chamado recebe 404,
// e não 403.
async function carregarComAcesso(
  id: bigint,
  u: Logado,
) {
  const c = await carregar(id);

  if (!participa(c, u)) {
    throw new HttpError(
      404,
      'Chamado não encontrado.',
    );
  }

  return c;
}

// Ações do técnico: somente o técnico atribuído
// a ESTE chamado.
async function carregarComoTecnico(
  id: bigint,
  u: Logado,
) {
  const c = await carregarComAcesso(id, u);

  if (c.tecnicoId !== u.id) {
    throw new HttpError(
      403,
      'Só o técnico atribuído a este chamado pode fazer isso.',
    );
  }

  return c;
}

const CONFLITO =
  'O chamado mudou enquanto você mexia nele. Atualize a página e tente de novo.';

// ============================================================
// Eventos
// ============================================================

async function registrar(
  chamadoId: bigint,
  atorId: string,
  tipo: TipoEvento,
  detalhe: Record<string, string | number | null> = {},
) {
  await db.orm.public.ChamadoEventos.create({
    chamadoId,
    atorId,
    tipo,
    detalhe,
  });
}

async function resposta(c: ChamadoRow) {
  return toPublicChamado(
    c,
    await carregarContexto(),
  );
}

// ============================================================
// Casos de uso
// ============================================================

// ------------------------------------------------------------
// Criar chamado
// ------------------------------------------------------------

export async function criarChamado(
  u: Logado,
  dados: {
    titulo: string;
    descricao: string;
    categoriaId: number;
    prioridadeId: number;
  },
) {
  const categoria =
    await db.orm.public.Categorias.first({
      id: dados.categoriaId,
    });

  if (!categoria || !categoria.ativa) {
    throw new HttpError(
      400,
      'Categoria inválida.',
    );
  }

  const prioridade =
    await db.orm.public.Prioridades.first({
      id: dados.prioridadeId,
    });

  if (!prioridade) {
    throw new HttpError(
      400,
      'Prioridade inválida.',
    );
  }

  // O banco calcula o prazo de SLA sozinho.
  // O status começa como "aberto".
  const c =
    await db.orm.public.Chamados.create({
      solicitanteId: u.id,
      titulo: dados.titulo,
      descricao: dados.descricao,
      categoriaId: dados.categoriaId,
      prioridadeId: dados.prioridadeId,
    });

  await registrar(
    c.id,
    u.id,
    'criado',
  );

  return resposta(c);
}

// ------------------------------------------------------------
// Listar chamados
// ------------------------------------------------------------

export async function listarChamados(
  u: Logado,
  filtros: {
    escopo?: Escopo;
    status?: StatusChamado;
  },
) {
  const escopo: Escopo =
    filtros.escopo ??
    (
      u.perfil === 'administrador'
        ? 'todos'
        : u.perfil === 'tecnico'
          ? 'atribuidos'
          : 'solicitados'
    );

  if (
    escopo === 'atribuidos' &&
    u.perfil !== 'tecnico'
  ) {
    throw new HttpError(
      403,
      'Só técnicos têm chamados atribuídos.',
    );
  }

  if (
    (escopo === 'todos' ||
      escopo === 'sem-tecnico') &&
    u.perfil !== 'administrador'
  ) {
    throw new HttpError(
      403,
      'Apenas administradores veem os chamados de todos.',
    );
  }

  let linhas: ChamadoRow[];

  if (escopo === 'solicitados') {
    linhas =
      await db.orm.public.Chamados
        .where({
          solicitanteId: u.id,
        })
        .all();
  } else if (escopo === 'atribuidos') {
    linhas =
      await db.orm.public.Chamados
        .where({
          tecnicoId: u.id,
        })
        .all();
  } else if (escopo === 'sem-tecnico') {
    linhas =
      (
        await db.orm.public.Chamados
          .where({
            status: 'aberto',
          })
          .all()
      ).filter(
        (c) => !c.tecnicoId,
      );
  } else {
    linhas =
      await db.orm.public.Chamados.all();
  }

  if (filtros.status) {
    linhas = linhas.filter(
      (c) =>
        c.status === filtros.status,
    );
  }

  const ctx =
    await carregarContexto();

  const peso = (
    c: ChamadoRow,
  ) =>
    ctx.prioridade.get(
      c.prioridadeId,
    )?.peso ?? 0;

  const filaDeUrgencia =
    escopo === 'atribuidos' ||
    escopo === 'sem-tecnico';

  linhas.sort(
    filaDeUrgencia
      ? (a, b) =>
          peso(b) -
            peso(a) ||
          tempo(a.prazoSla) -
            tempo(b.prazoSla)

      : (a, b) =>
          tempo(b.criadoEm) -
          tempo(a.criadoEm),
  );

  return linhas.map(
    (c) =>
      toPublicChamado(c, ctx),
  );
}

// ------------------------------------------------------------
// Buscar chamado
// ------------------------------------------------------------

export async function buscarChamado(
  id: bigint,
  u: Logado,
) {
  const c =
    await carregarComAcesso(id, u);

  const ctx =
    await carregarContexto();

  const eventos =
    (
      await db.orm.public.ChamadoEventos
        .where({
          chamadoId: c.id,
        })
        .all()
    ).sort(
      (a, b) =>
        tempo(a.criadoEm) -
        tempo(b.criadoEm),
    );

  return {
    ...toPublicChamado(c, ctx),

    historico: eventos.map(
      (e) => ({
        tipo: e.tipo,

        por: pessoa(
          ctx,
          e.atorId,
        ),

        detalhe: e.detalhe,

        criadoEm: e.criadoEm,
      }),
    ),
  };
}

// ------------------------------------------------------------
// Atribuir chamado
// Administrador: aberto -> aberto com técnico
// ------------------------------------------------------------

export async function atribuirChamado(
  id: bigint,
  tecnicoId: string,
  admin: Logado,
) {
  const c = await carregar(id);

  if (c.status !== 'aberto') {
    throw new HttpError(
      409,
      'Só chamados abertos podem ser atribuídos. Se já está em andamento, o técnico precisa devolvê-lo antes.',
    );
  }

  const tecnico =
    await db.orm.public.Usuarios.first({
      id: tecnicoId,
    });

  if (
    !tecnico ||
    tecnico.perfil !== 'tecnico' ||
    tecnico.situacao !== 'ativo'
  ) {
    throw new HttpError(
      400,
      'O usuário informado não é um técnico ativo.',
    );
  }

  const novo =
    await db.orm.public.Chamados
      .where({
        id: c.id,
        status: c.status,
      })
      .update({
        tecnicoId,
        atribuidoPor: admin.id,
        atribuidoEm: agora(),
      });

  if (!novo) {
    throw new HttpError(
      409,
      CONFLITO,
    );
  }

  await registrar(
    c.id,
    admin.id,
    'atribuido',
    {
      tecnicoId,
      tecnicoAnterior:
        c.tecnicoId ?? null,
    },
  );

  return resposta(novo);
}

// ------------------------------------------------------------
// Iniciar chamado
// Técnico atribuído: aberto -> em andamento
// ------------------------------------------------------------

export async function iniciarChamado(
  id: bigint,
  u: Logado,
) {
  const c =
    await carregarComoTecnico(
      id,
      u,
    );

  if (c.status !== 'aberto') {
    throw new HttpError(
      409,
      'Só chamados abertos podem ser iniciados.',
    );
  }

  const novo =
    await db.orm.public.Chamados
      .where({
        id: c.id,
        status: c.status,
      })
      .update({
        status: 'em_andamento',
        iniciadoEm: agora(),
      });

  if (!novo) {
    throw new HttpError(
      409,
      CONFLITO,
    );
  }

  await registrar(
    c.id,
    u.id,
    'iniciado',
  );

  return resposta(novo);
}

// ------------------------------------------------------------
// Devolver chamado
// Técnico atribuído:
// aberto/em andamento -> aberto sem técnico
// ------------------------------------------------------------

export async function devolverChamado(
  id: bigint,
  u: Logado,
  motivo?: string,
) {
  const c =
    await carregarComoTecnico(
      id,
      u,
    );

  if (
    c.status !== 'aberto' &&
    c.status !== 'em_andamento'
  ) {
    throw new HttpError(
      409,
      'Só dá para devolver um chamado aberto ou em andamento.',
    );
  }

  const novo =
    await db.orm.public.Chamados
      .where({
        id: c.id,
        status: c.status,
      })
      .update({
        status: 'aberto',
        tecnicoId: null,
        atribuidoPor: null,
        atribuidoEm: null,
        iniciadoEm: null,
      });

  if (!novo) {
    throw new HttpError(
      409,
      CONFLITO,
    );
  }

  await registrar(
    c.id,
    u.id,
    'devolvido',
    {
      motivo: motivo ?? null,
    },
  );

  return resposta(novo);
}

// ------------------------------------------------------------
// Resolver chamado
// Técnico atribuído:
// em andamento -> resolvido
// ------------------------------------------------------------

export async function resolverChamado(
  id: bigint,
  u: Logado,
  solucao: string,
) {
  const c =
    await carregarComoTecnico(
      id,
      u,
    );

  if (c.status === 'aberto') {
    throw new HttpError(
      409,
      'Inicie o atendimento antes de marcar como resolvido.',
    );
  }

  if (c.status !== 'em_andamento') {
    throw new HttpError(
      409,
      'Este chamado não está em andamento.',
    );
  }

  const novo =
    await db.orm.public.Chamados
      .where({
        id: c.id,
        status: c.status,
      })
      .update({
        status: 'resolvido',
        resolvidoEm: agora(),
        solucao,
      });

  if (!novo) {
    throw new HttpError(
      409,
      CONFLITO,
    );
  }

  await registrar(
    c.id,
    u.id,
    'resolvido',
  );

  return resposta(novo);
}

// ------------------------------------------------------------
// Cancelar chamado
// Quem abriu:
// somente enquanto aberto e sem técnico
// ------------------------------------------------------------

export async function cancelarChamado(
  id: bigint,
  u: Logado,
) {
  const c =
    await carregarComAcesso(
      id,
      u,
    );

  if (c.solicitanteId !== u.id) {
    throw new HttpError(
      403,
      'Só quem abriu o chamado pode cancelá-lo.',
    );
  }

  if (
    c.status !== 'aberto' ||
    c.tecnicoId
  ) {
    throw new HttpError(
      409,
      'Só dá para cancelar enquanto o chamado está aberto e sem técnico atribuído.',
    );
  }

  const novo =
    await db.orm.public.Chamados
      .where({
        id: c.id,
        status: c.status,
      })
      .update({
        status: 'cancelado',
      });

  if (!novo) {
    throw new HttpError(
      409,
      CONFLITO,
    );
  }

  await registrar(
    c.id,
    u.id,
    'cancelado',
  );

  return resposta(novo);
}

// ------------------------------------------------------------
// Alterar prioridade
// Administrador
// ------------------------------------------------------------

export async function alterarPrioridade(
  id: bigint,
  prioridadeId: number,
  admin: Logado,
) {
  const c = await carregar(id);

  if (
    c.status === 'resolvido' ||
    c.status === 'cancelado'
  ) {
    throw new HttpError(
      409,
      'Não dá para mudar a prioridade de um chamado encerrado.',
    );
  }

  const nova =
    await db.orm.public.Prioridades.first({
      id: prioridadeId,
    });

  if (!nova) {
    throw new HttpError(
      400,
      'Prioridade inválida.',
    );
  }

  if (
    c.prioridadeId === prioridadeId
  ) {
    return resposta(c);
  }

  const antiga =
    await db.orm.public.Prioridades.first({
      id: c.prioridadeId,
    });

  const novo =
    await db.orm.public.Chamados
      .where({
        id: c.id,
        status: c.status,
      })
      .update({
        prioridadeId,
      });

  if (!novo) {
    throw new HttpError(
      409,
      CONFLITO,
    );
  }

  await registrar(
    c.id,
    admin.id,
    'prioridade_alterada',
    {
      de: antiga?.nome ?? null,
      para: nova.nome,
    },
  );

  return resposta(novo);
}