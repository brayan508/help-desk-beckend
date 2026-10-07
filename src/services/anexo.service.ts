import { db } from '../prisma/db.js';
import { HttpError } from '../lib/http-error.js';

type Logado = {
  id: string;
  perfil: 'administrador' | 'tecnico' | 'usuario';
};

export async function criarAnexo(
  chamadoId: bigint,
  usuario: Logado,
  arquivo: Express.Multer.File,
) {
  // Verifica se o chamado existe
  const chamado = await db.orm.public.Chamados.first({
    id: chamadoId,
  });

  if (!chamado) {
    throw new HttpError(404, 'Chamado não encontrado.');
  }

  // Administrador, solicitante ou técnico atribuído podem anexar arquivos
  const podeAnexar =
    usuario.perfil === 'administrador' ||
    chamado.solicitanteId === usuario.id ||
    chamado.tecnicoId === usuario.id;

  if (!podeAnexar) {
    throw new HttpError(
      403,
      'Você não tem permissão para anexar arquivos neste chamado.',
    );
  }

  // Garante que o arquivo realmente foi recebido
  if (!arquivo) {
    throw new HttpError(400, 'Nenhum arquivo foi enviado.');
  }

  const anexo = await db.orm.public.Anexos.create({
    chamadoId,
    enviadoPor: usuario.id,
    nomeArquivo: arquivo.originalname,
    tipoMime: arquivo.mimetype,
    tamanhoBytes: BigInt(arquivo.size),
    caminho: arquivo.path,
  });

  return {
    id: Number(anexo.id),
    chamadoId: Number(anexo.chamadoId),
    enviadoPor: anexo.enviadoPor,
    nomeArquivo: anexo.nomeArquivo,
    tipoMime: anexo.tipoMime,
    tamanhoBytes: Number(anexo.tamanhoBytes),
    caminho: anexo.caminho,
    criadoEm: anexo.criadoEm,
  };
}