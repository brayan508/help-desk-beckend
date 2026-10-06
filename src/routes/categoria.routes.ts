// Arquivo: src/routes/categoria.route.ts

import { Router } from 'express';

import { CategoriaController } from '../controllers/categoria.controller.js';

import { validate } from '../middlewares/validate.middleware.js';

import { autenticar, exigirPerfil } from '../middlewares/auth.middleware.js';

import {
  listarCategoriasSchema,
  criarCategoriaSchema,
  atualizarCategoriaSchema,
} from '../schemas/categoria.schema.js';

/**
 * @openapi
 * components:
 *   schemas:
 *
 *     Categoria:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nome:
 *           type: string
 *           example: Hardware
 *         descricao:
 *           type: string
 *           nullable: true
 *           example: Problemas relacionados a computadores e equipamentos.
 *         ativa:
 *           type: boolean
 *           example: true
 *
 *     CriarCategoria:
 *       type: object
 *       additionalProperties: false
 *       required:
 *         - nome
 *       properties:
 *         nome:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: Hardware
 *         descricao:
 *           type: string
 *           nullable: true
 *           example: Problemas relacionados a computadores e equipamentos.
 *
 *     AtualizarCategoria:
 *       type: object
 *       additionalProperties: false
 *       properties:
 *         nome:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: Hardware
 *         descricao:
 *           type: string
 *           nullable: true
 *           example: Problemas relacionados a computadores e equipamentos.
 *         ativa:
 *           type: boolean
 *           example: true
 *
 * /categorias:
 *   get:
 *     summary: Listar categorias
 *     description: Retorna as categorias cadastradas no sistema.
 *     tags:
 *       - Categorias
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: apenasAtivas
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Quando verdadeiro, retorna somente categorias ativas.
 *
 *     responses:
 *       '200':
 *         description: Lista de categorias retornada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Categoria'
 *       '400':
 *         description: Parâmetros inválidos.
 *       '401':
 *         description: Token ausente ou inválido.
 *
 *   post:
 *     summary: Criar categoria
 *     description: Cria uma nova categoria. Apenas administradores podem executar esta operação.
 *     tags:
 *       - Categorias
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CriarCategoria'
 *     responses:
 *       '201':
 *         description: Categoria criada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Categoria'
 *       '400':
 *         description: Dados inválidos.
 *       '401':
 *         description: Token ausente ou inválido.
 *       '403':
 *         description: Apenas administradores podem criar categorias.
 *       '409':
 *         description: Já existe uma categoria com os dados informados.
 *
 * /categorias/{id}:
 *   patch:
 *     summary: Atualizar categoria
 *     description: Atualiza uma categoria existente. Apenas administradores podem executar esta operação.
 *     tags:
 *       - Categorias
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID da categoria.
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AtualizarCategoria'
 *     responses:
 *       '200':
 *         description: Categoria atualizada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Categoria'
 *       '400':
 *         description: ID ou dados inválidos.
 *       '401':
 *         description: Token ausente ou inválido.
 *       '403':
 *         description: Apenas administradores podem atualizar categorias.
 *       '404':
 *         description: Categoria não encontrada.
 *       '409':
 *         description: Conflito ao atualizar a categoria.
 */

const router = Router();

// Login só neste caminho (para caminhos que não existem continuarem dando 404).
router.use('/categorias', autenticar);

router.get(
  '/categorias',
  validate(listarCategoriasSchema),
  CategoriaController.listar,
);

router.post(
  '/categorias',
  exigirPerfil('administrador'),
  validate(criarCategoriaSchema),
  CategoriaController.criar,
);

router.patch(
  '/categorias/:id',
  exigirPerfil('administrador'),
  validate(atualizarCategoriaSchema),
  CategoriaController.atualizar,
);

export default router;