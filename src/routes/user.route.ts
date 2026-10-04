// Arquivo: src/routes/user.route.ts — rotas que exigem login

import { Router } from 'express';

import { UserController } from '../controllers/user.controller.js';

import { validate } from '../middlewares/validate.middleware.js';

import { autenticar, exigirPerfil } from '../middlewares/auth.middleware.js';

import {
  atualizarPerfilSchema,
  trocarSenhaSchema,
  userIdSchema,
  aprovarSchema,
} from '../schemas/user.schema.js';

/**
 * @openapi
 * components:
 *   schemas:
 *
 *     PublicUser:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         nome:
 *           type: string
 *           example: "João da Silva"
 *         email:
 *           type: string
 *           format: email
 *           example: "joao@email.com"
 *         telefone:
 *           type: string
 *           nullable: true
 *           example: "(12) 99999-9999"
 *         setor:
 *           type: string
 *           nullable: true
 *           example: "TI"
 *         perfil:
 *           type: string
 *           nullable: true
 *           enum:
 *             - administrador
 *             - tecnico
 *             - usuario
 *           example: usuario
 *         situacao:
 *           type: string
 *           enum:
 *             - pendente
 *             - ativo
 *             - inativo
 *           example: ativo
 *         criadoEm:
 *           type: string
 *           format: date-time
 *
 *     AtualizarPerfil:
 *       type: object
 *       additionalProperties: false
 *       properties:
 *         nome:
 *           type: string
 *           minLength: 2
 *           maxLength: 120
 *           example: "João da Silva"
 *         telefone:
 *           type: string
 *           nullable: true
 *           example: "(12) 99999-9999"
 *         setor:
 *           type: string
 *           nullable: true
 *           example: "TI"
 *
 *     TrocarSenha:
 *       type: object
 *       additionalProperties: false
 *       required:
 *         - senhaAtual
 *         - novaSenha
 *       properties:
 *         senhaAtual:
 *           type: string
 *           format: password
 *           example: "SenhaAtual123!"
 *         novaSenha:
 *           type: string
 *           format: password
 *           minLength: 8
 *           maxLength: 72
 *           example: "NovaSenha123!"
 *
 *     AprovarUsuario:
 *       type: object
 *       additionalProperties: false
 *       required:
 *         - perfil
 *       properties:
 *         perfil:
 *           type: string
 *           enum:
 *             - administrador
 *             - tecnico
 *             - usuario
 *           example: usuario
 *
 * /me:
 *   get:
 *     summary: Consultar o próprio perfil
 *     tags:
 *       - Usuários
 *     responses:
 *       '200':
 *         description: Dados do usuário autenticado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicUser'
 *       '401':
 *         description: Token ausente, inválido ou usuário não autenticado.
 *       '404':
 *         description: Usuário não encontrado.
 *
 *   patch:
 *     summary: Atualizar o próprio perfil
 *     tags:
 *       - Usuários
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AtualizarPerfil'
 *     responses:
 *       '200':
 *         description: Perfil atualizado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicUser'
 *       '400':
 *         description: Dados inválidos.
 *       '401':
 *         description: Token ausente ou inválido.
 *       '404':
 *         description: Usuário não encontrado.
 *
 * /me/senha:
 *   put:
 *     summary: Alterar a própria senha
 *     tags:
 *       - Usuários
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TrocarSenha'
 *     responses:
 *       '204':
 *         description: Senha alterada com sucesso.
 *       '400':
 *         description: Dados inválidos ou senha atual incorreta.
 *       '401':
 *         description: Token ausente ou inválido.
 *       '404':
 *         description: Usuário não encontrado.
 *
 * /usuarios:
 *   get:
 *     summary: Listar usuários
 *     description: Disponível somente para administradores.
 *     tags:
 *       - Usuários
 *     responses:
 *       '200':
 *         description: Lista de usuários.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PublicUser'
 *       '401':
 *         description: Token ausente ou inválido.
 *       '403':
 *         description: Usuário não possui perfil de administrador.
 *
 * /usuarios/{id}:
 *   get:
 *     summary: Consultar usuário
 *     description: Administradores podem consultar qualquer usuário. Usuários comuns somente o próprio cadastro.
 *     tags:
 *       - Usuários
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: UUID do usuário.
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       '200':
 *         description: Usuário encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicUser'
 *       '400':
 *         description: UUID inválido.
 *       '401':
 *         description: Token ausente ou inválido.
 *       '403':
 *         description: Usuário não possui permissão para consultar este cadastro.
 *       '404':
 *         description: Usuário não encontrado.
 *
 * /usuarios/{id}/aprovar:
 *   post:
 *     summary: Aprovar cadastro de usuário
 *     description: Disponível somente para administradores.
 *     tags:
 *       - Administração
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: UUID do usuário que será aprovado.
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AprovarUsuario'
 *     responses:
 *       '200':
 *         description: Usuário aprovado com sucesso.
 *       '400':
 *         description: Dados inválidos.
 *       '401':
 *         description: Token ausente ou inválido.
 *       '403':
 *         description: Usuário não possui perfil de administrador.
 *       '404':
 *         description: Usuário não encontrado.
 *       '409':
 *         description: Cadastro já aprovado ou não está pendente.
 *
 * /usuarios/{id}/desativar:
 *   post:
 *     summary: Desativar usuário
 *     description: Disponível somente para administradores.
 *     tags:
 *       - Administração
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: UUID do usuário que será desativado.
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       '200':
 *         description: Usuário desativado com sucesso.
 *       '400':
 *         description: UUID inválido.
 *       '401':
 *         description: Token ausente ou inválido.
 *       '403':
 *         description: Usuário não possui perfil de administrador.
 *       '404':
 *         description: Usuário não encontrado.
 *
 * security:
 *   - bearerAuth: []
 */
const router = Router();

// Exige login só nestes caminhos.
router.use(['/me', '/usuarios'], autenticar);

// --- A própria pessoa (qualquer perfil) ---

router.get('/me', UserController.getMe);

router.patch(
  '/me',
  validate(atualizarPerfilSchema),
  UserController.updateMe,
);

router.put(
  '/me/senha',
  validate(trocarSenhaSchema),
  UserController.changeMyPassword,
);

// --- Administrador ---

router.get(
  '/usuarios',
  exigirPerfil('administrador'),
  UserController.getAllUsers,
);

router.post(
  '/usuarios/:id/aprovar',
  exigirPerfil('administrador'),
  validate(aprovarSchema),
  UserController.approveUser,
);

router.post(
  '/usuarios/:id/desativar',
  exigirPerfil('administrador'),
  validate(userIdSchema),
  UserController.deactivateUser,
);

// --- Administrador ou a própria pessoa ---

router.get(
  '/usuarios/:id',
  validate(userIdSchema),
  UserController.getUserById,
);

export default router;