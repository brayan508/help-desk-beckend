// Arquivo: src/routes/auth.route.ts — rotas públicas

import { Router } from 'express';

import { UserController } from '../controllers/user.controller.js';

import { AuthController } from '../controllers/auth.controllers.js';

import { validate } from '../middlewares/validate.middleware.js';

import { cadastroSchema } from '../schemas/user.schema.js';

import { loginSchema } from '../schemas/auth.schema.js';

/**
 * @openapi
 * components:
 *   schemas:
 *
 *     Cadastro:
 *       type: object
 *       additionalProperties: false
 *       required:
 *         - nome
 *         - email
 *         - senha
 *       properties:
 *         nome:
 *           type: string
 *           minLength: 2
 *           maxLength: 120
 *           example: Brayan Rodrigues
 *         email:
 *           type: string
 *           format: email
 *           maxLength: 254
 *           example: brayan@email.com
 *         senha:
 *           type: string
 *           format: password
 *           minLength: 8
 *           maxLength: 72
 *           example: Teste123!
 *         telefone:
 *           type: string
 *           nullable: true
 *           example: "12999999999"
 *         setor:
 *           type: string
 *           nullable: true
 *           example: Tecnologia
 *
 *     Login:
 *       type: object
 *       additionalProperties: false
 *       required:
 *         - email
 *         - senha
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: brayan@email.com
 *         senha:
 *           type: string
 *           format: password
 *           example: Teste123!
 *
 *     LoginResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: Token JWT utilizado para autenticar as requisições.
 *         user:
 *           $ref: '#/components/schemas/PublicUser'
 *
 * /cadastro:
 *   post:
 *     summary: Criar uma nova conta
 *     description: Cadastra um novo usuário. A conta inicia como pendente e precisa ser aprovada por um administrador.
 *     tags:
 *       - Autenticação
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Cadastro'
 *     responses:
 *       '201':
 *         description: Cadastro realizado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicUser'
 *       '400':
 *         description: Dados inválidos.
 *       '409':
 *         description: E-mail já cadastrado.
 *       '429':
 *         description: Limite de requisições excedido.
 *
 * /login:
 *   post:
 *     summary: Realizar login
 *     description: Autentica o usuário e retorna um token JWT.
 *     tags:
 *       - Autenticação
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Login'
 *     responses:
 *       '200':
 *         description: Login realizado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       '400':
 *         description: Dados inválidos.
 *       '401':
 *         description: E-mail ou senha incorretos.
 *       '403':
 *         description: Usuário pendente ou conta inativa.
 *       '429':
 *         description: Muitas tentativas de login.
 *
 * /logout:
 *   post:
 *     summary: Realizar logout
 *     description: Encerra a sessão removendo o cookie de autenticação.
 *     tags:
 *       - Autenticação
 *     security: []
 *     responses:
 *       '204':
 *         description: Logout realizado com sucesso.
 *       '200':
 *         description: Logout realizado com sucesso.
 */

const router = Router();

router.post(
  '/cadastro',
  validate(cadastroSchema),
  UserController.createUser,
);

router.post(
  '/login',
  validate(loginSchema),
  AuthController.login,
);

router.post(
  '/logout',
  AuthController.logout,
);

export default router;