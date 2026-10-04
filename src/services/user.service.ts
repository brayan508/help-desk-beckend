// Arquivo: src/services/user.service.ts
import bcrypt from 'bcrypt';
import { db } from '../prisma/db.js';
import { HttpError } from '../lib/http-error.js';

const SALT_ROUNDS = 12;
const PERFIS = ['administrador', 'tecnico', 'usuario'] as const;
export type Perfil = (typeof PERFIS)[number];

// O banco exige e-mail em minúsculas (CHECK email_minusculo).
// Sempre normalize ANTES de gravar e ANTES de buscar.
export const normalizarEmail = (email: string) => email.trim().toLowerCase();

// ---------- Entradas ----------
// Cadastro público: SÓ estes campos. Perfil e situação NÃO entram aqui:
// quem se cadastra nasce "pendente", sem perfil, e o administrador decide.
export interface CadastroInput {
  nome: string;
  email: string;
  senha: string; // senha em texto puro; vira hash aqui dentro
  telefone?: string;
  setor?: string;
}

// Edição pelo próprio usuário (tela de Perfil): e-mail e perfil são só leitura.
export interface AtualizarPerfilInput {
  nome?: string;
  telefone?: string;
  setor?: string;
}

type UserRow = Awaited<ReturnType<typeof db.orm.public.Usuarios.create>>;

// Nunca devolva a linha crua: ela contém senhaHash.
export const toPublicUser = (user: UserRow) => ({
  id: user.id,
  nome: user.nome,
  email: user.email,
  telefone: user.telefone,
  setor: user.setor,
  perfil: user.perfil,
  situacao: user.situacao,
  criadoEm: user.criadoEm,
});

function validarSenha(senha: string) {
  if (typeof senha !== 'string' || senha.length < 8) {
    throw new HttpError(400, 'A senha precisa ter pelo menos 8 caracteres.');
  }
  // bcrypt só considera os primeiros 72 bytes
  if (Buffer.byteLength(senha, 'utf8') > 72) {
    throw new HttpError(400, 'A senha pode ter no máximo 72 caracteres.');
  }
}

// ---------- Cadastro ----------
export async function createUser(data: CadastroInput) {
  const nome = data.nome?.trim();
  const email = normalizarEmail(data.email ?? '');
  if (!nome) throw new HttpError(400, 'Informe o nome.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'E-mail inválido.');
  validarSenha(data.senha);

  if (await db.orm.public.Usuarios.first({ email })) {
    throw new HttpError(409, 'Este e-mail já está cadastrado.');
  }

  try {
    const user = await db.orm.public.Usuarios.create({
      nome,
      email,
      senhaHash: await bcrypt.hash(data.senha, SALT_ROUNDS),
      telefone: data.telefone?.trim() || null,
      setor: data.setor?.trim() || null,
      // perfil: omitido (fica NULL) | situacao: padrão do banco = 'pendente'
    });
    return toPublicUser(user);
  } catch (err: any) {
    // duas pessoas cadastrando o mesmo e-mail ao mesmo tempo
    // (confira no seu Prisma qual é o código do erro de violação de unicidade)
    if (err?.code === 'P2002' || err?.code === '23505') {
      throw new HttpError(409, 'Este e-mail já está cadastrado.');
    }
    throw err;
  }
}

// ---------- Consultas (use só em rotas de administrador) ----------
export async function getAllUsers() {
  const users = await db.orm.public.Usuarios.all();
  return users.map(toPublicUser);
}

export async function getUserById(id: string) {
  const user = await db.orm.public.Usuarios.first({ id });
  if (!user) throw new HttpError(404, 'Usuário não encontrado.');
  return toPublicUser(user);
}

// ---------- Perfil do próprio usuário ----------
export async function updateUser(id: string, data: AtualizarPerfilInput) {
  const changes: AtualizarPerfilInput = {};
  if (data.nome !== undefined) {
    if (!data.nome.trim()) throw new HttpError(400, 'O nome não pode ficar vazio.');
    changes.nome = data.nome.trim();
  }
  if (data.telefone !== undefined) changes.telefone = data.telefone.trim();
  if (data.setor !== undefined) changes.setor = data.setor.trim();
  if (Object.keys(changes).length === 0) throw new HttpError(400, 'Informe pelo menos um campo.');

  const user = await db.orm.public.Usuarios.where({ id }).update(changes);
  if (!user) throw new HttpError(404, 'Usuário não encontrado.');
  return toPublicUser(user);
}

export async function changePassword(id: string, senhaAtual: string, novaSenha: string) {
  validarSenha(novaSenha);
  const user = await db.orm.public.Usuarios.first({ id });
  if (!user) throw new HttpError(404, 'Usuário não encontrado.');
  if (!(await bcrypt.compare(senhaAtual, user.senhaHash))) {
    throw new HttpError(400, 'A senha atual está incorreta.');
  }
  await db.orm.public.Usuarios.where({ id }).update({
    senhaHash: await bcrypt.hash(novaSenha, SALT_ROUNDS),
  });
}

// ---------- Ações do administrador ----------

// Tela de Usuários > "Aprovar": define o perfil e ativa a conta.
// Ideal: rodar tudo numa transação (veja como fazer na documentação do seu Prisma).
export async function approveUser(id: string, perfil: Perfil, adminId: string) {
  if (!PERFIS.includes(perfil)) throw new HttpError(400, 'Perfil inválido.');

  const user = await db.orm.public.Usuarios.first({ id });
  if (!user) throw new HttpError(404, 'Usuário não encontrado.');
  if (user.situacao !== 'pendente') throw new HttpError(409, 'Este cadastro não está aguardando aprovação.');

  await db.orm.public.Usuarios.where({ id }).update({
    perfil,
    situacao: 'ativo',
    aprovadoPor: adminId,
    aprovadoEm: new Date(),
  });

  // técnico precisa da linha de configurações (disponibilidade, limite, horário)
  if (perfil === 'tecnico') {
    await db.orm.public.Tecnicos.create({ usuarioId: id });
  }

  await db.orm.public.Auditoria.create({
    atorId: adminId,
    acao: 'aprovar_cadastro',
    alvoId: id,
    detalhe: { perfil },
  });
}

// Em vez de apagar (o histórico de chamados depende do usuário), desative.
// O banco impede desativar o último administrador ativo.
export async function deactivateUser(id: string, adminId: string) {
  if (id === adminId) throw new HttpError(409, 'Você não pode desativar a própria conta.');
  try {
    const user = await db.orm.public.Usuarios.where({ id }).update({ situacao: 'inativo' });
    if (!user) throw new HttpError(404, 'Usuário não encontrado.');
  } catch (err: any) {
    if (String(err?.message).includes('pelo menos um administrador')) {
      throw new HttpError(409, 'Precisa existir pelo menos um administrador ativo.');
    }
    throw err;
  }
  await db.orm.public.Auditoria.create({ atorId: adminId, acao: 'desativar_conta', alvoId: id, detalhe: {} });
}