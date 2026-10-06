// Arquivo: src/routes/chamado.route.ts

import { Router } from 'express';

import { ChamadoController } from '../controllers/chamado.controller.js';

import { validate } from '../middlewares/validate.middleware.js';

import { autenticar, exigirPerfil } from '../middlewares/auth.middleware.js';

import {
  criarChamadoSchema,
  listarChamadosSchema,
  idChamadoSchema,
  atribuirChamadoSchema,
  devolverChamadoSchema,
  resolverChamadoSchema,
  alterarPrioridadeSchema,
} from '../schemas/chamado.schema.js';

/**
 * @openapi
 * components:
 *   schemas:
 *
 *     PessoaChamado:
 *       type: object
 *       nullable: true
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         nome:
 *           type: string
 *           example: "João da Silva"
 *
 *     CategoriaChamado:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nome:
 *           type: string
 *           example: "Hardware"
 *
 *     PrioridadeChamado:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 2
 *         nome:
 *           type: string
 *           example: "Alta"
 *         slaHoras:
 *           type: integer
 *           nullable: true
 *           example: 4
 *
 *     Chamado:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           example: 15
 *         titulo:
 *           type: string
 *           example: "Computador não liga"
 *         descricao:
 *           type: string
 *           example: "O computador do setor financeiro não liga."
 *         status:
 *           type: string
 *           enum:
 *             - aberto
 *             - em_andamento
 *             - resolvido
 *             - cancelado
 *           example: "aberto"
 *         categoria:
 *           $ref: '#/components/schemas/CategoriaChamado'
 *         prioridade:
 *           $ref: '#/components/schemas/PrioridadeChamado'
 *         solicitante:
 *           $ref: '#/components/schemas/PessoaChamado'
 *         tecnico:
 *           $ref: '#/components/schemas/PessoaChamado'
 *         solucao:
 *           type: string
 *           nullable: true
 *           example: "Foi realizada a troca da fonte de alimentação."
 *         prazoSla:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         slaVencido:
 *           type: boolean
 *           example: false
 *         criadoEm:
 *           type: string
 *           format: date-time
 *         atribuidoEm:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         iniciadoEm:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         resolvidoEm:
 *           type: string
 *           format: date-time
 *           nullable: true
 *
 *     CriarChamado:
 *       type: object
 *       additionalProperties: false
 *       required:
 *         - titulo
 *         - descricao
 *         - categoriaId
 *         - prioridadeId
 *       properties:
 *         titulo:
 *           type: string
 *           example: "Computador não liga"
 *         descricao:
 *           type: string
 *           example: "O computador do setor financeiro não liga."
 *         categoriaId:
 *           type: integer
 *           example: 1
 *         prioridadeId:
 *           type: integer
 *           example: 2
 *
 *     AtribuirChamado:
 *       type: object
 *       additionalProperties: false
 *       required:
 *         - tecnicoId
 *       properties:
 *         tecnicoId:
 *           type: string
 *           format: uuid
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *
 *     DevolverChamado:
 *       type: object
 *       additionalProperties: false
 *       properties:
 *         motivo:
 *           type: string
 *           nullable: true
 *           example: "Necessário equipamento especializado."
 *
 *     ResolverChamado:
 *       type: object
 *       additionalProperties: false
 *       required:
 *         - solucao
 *       properties:
 *         solucao:
 *           type: string
 *           minLength: 1
 *           example: "Foi realizada a troca da fonte de alimentação."
 *
 *     AlterarPrioridade:
 *       type: object
 *       additionalProperties: false
 *       required:
 *         - prioridadeId
 *       properties:
 *         prioridadeId:
 *           type: integer
 *           example: 1
 *
 * /chamados:
 *   post:
 *     summary: Criar chamado
 *     description: Cria um novo chamado para o usuário autenticado.
 *     tags:
 *       - Chamados
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CriarChamado'
 *     responses:
 *       '201':
 *         description: Chamado criado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chamado'
 *       '400':
 *         description: Categoria ou prioridade inválida, ou dados inválidos.
 *       '401':
 *         description: Token ausente ou inválido.
 *       '429':
 *         description: Limite de requisições excedido.
 *
 *   get:
 *     summary: Listar chamados
 *     description: Lista chamados de acordo com o perfil do usuário e o escopo solicitado.
 *     tags:
 *       - Chamados
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: escopo
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - solicitados
 *             - atribuidos
 *             - todos
 *             - sem-tecnico
 *         description: |
 *           Escopo da consulta.
 *           Usuários comuns veem seus chamados solicitados.
 *           Técnicos podem consultar os chamados atribuídos a eles.
 *           Administradores podem consultar todos ou chamados sem técnico.
 *
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - aberto
 *             - em_andamento
 *             - resolvido
 *             - cancelado
 *         description: Filtra os chamados pelo status.
 *
 *     responses:
 *       '200':
 *         description: Lista de chamados.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Chamado'
 *       '400':
 *         description: Filtros inválidos.
 *       '401':
 *         description: Token ausente ou inválido.
 *       '403':
 *         description: Perfil sem permissão para o escopo solicitado.
 *
 * /chamados/{id}:
 *   get:
 *     summary: Consultar chamado
 *     description: Retorna os detalhes de um chamado e seu histórico.
 *     tags:
 *       - Chamados
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *         description: ID do chamado.
 *         example: 15
 *     responses:
 *       '200':
 *         description: Chamado encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Chamado'
 *                 - type: object
 *                   properties:
 *                     historico:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           tipo:
 *                             type: string
 *                             example: "criado"
 *                           por:
 *                             $ref: '#/components/schemas/PessoaChamado'
 *                           detalhe:
 *                             type: object
 *                           criadoEm:
 *                             type: string
 *                             format: date-time
 *       '400':
 *         description: ID inválido.
 *       '401':
 *         description: Token ausente ou inválido.
 *       '404':
 *         description: Chamado não encontrado.
 *
 * /chamados/{id}/atribuir:
 *   post:
 *     summary: Atribuir chamado a um técnico
 *     description: Somente administradores podem atribuir um chamado aberto a um técnico ativo.
 *     tags:
 *       - Chamados
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *         example: 15
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AtribuirChamado'
 *     responses:
 *       '200':
 *         description: Chamado atribuído com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chamado'
 *       '400':
 *         description: Técnico inválido.
 *       '401':
 *         description: Token ausente ou inválido.
 *       '403':
 *         description: Apenas administradores podem atribuir chamados.
 *       '404':
 *         description: Chamado não encontrado.
 *       '409':
 *         description: O chamado não está aberto ou sofreu alteração simultânea.
 *
 * /chamados/{id}/prioridade:
 *   patch:
 *     summary: Alterar prioridade do chamado
 *     description: Somente administradores podem alterar a prioridade. O SLA é recalculado pelo banco.
 *     tags:
 *       - Chamados
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *         example: 15
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlterarPrioridade'
 *     responses:
 *       '200':
 *         description: Prioridade alterada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chamado'
 *       '400':
 *         description: Prioridade inválida.
 *       '401':
 *         description: Token ausente ou inválido.
 *       '403':
 *         description: Apenas administradores podem alterar a prioridade.
 *       '404':
 *         description: Chamado não encontrado.
 *       '409':
 *         description: Não é possível alterar a prioridade de um chamado encerrado.
 *
 * /chamados/{id}/iniciar:
 *   post:
 *     summary: Iniciar atendimento
 *     description: Somente o técnico atribuído ao chamado pode iniciar o atendimento.
 *     tags:
 *       - Chamados
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *         example: 15
 *     responses:
 *       '200':
 *         description: Atendimento iniciado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chamado'
 *       '400':
 *         description: ID inválido.
 *       '401':
 *         description: Token ausente ou inválido.
 *       '403':
 *         description: Usuário não é técnico ou não é o técnico atribuído ao chamado.
 *       '404':
 *         description: Chamado não encontrado.
 *       '409':
 *         description: O chamado não está aberto ou sofreu alteração simultânea.
 *
 * /chamados/{id}/devolver:
 *   post:
 *     summary: Devolver chamado
 *     description: O técnico atribuído devolve o chamado para a fila administrativa.
 *     tags:
 *       - Chamados
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *         example: 15
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DevolverChamado'
 *     responses:
 *       '200':
 *         description: Chamado devolvido e removido do técnico.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chamado'
 *       '400':
 *         description: Dados inválidos.
 *       '401':
 *         description: Token ausente ou inválido.
 *       '403':
 *         description: Usuário não é o técnico atribuído ao chamado.
 *       '404':
 *         description: Chamado não encontrado.
 *       '409':
 *         description: O chamado não está aberto/em andamento ou sofreu alteração simultânea.
 *
 * /chamados/{id}/resolver:
 *   post:
 *     summary: Resolver chamado
 *     description: Somente o técnico atribuído pode resolver um chamado em andamento. A solução é obrigatória.
 *     tags:
 *       - Chamados
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *         example: 15
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResolverChamado'
 *     responses:
 *       '200':
 *         description: Chamado resolvido com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chamado'
 *       '400':
 *         description: Dados inválidos.
 *       '401':
 *         description: Token ausente ou inválido.
 *       '403':
 *         description: Usuário não é o técnico atribuído ao chamado.
 *       '404':
 *         description: Chamado não encontrado.
 *       '409':
 *         description: Chamado não está em andamento ou sofreu alteração simultânea.
 *
 * /chamados/{id}/cancelar:
 *   post:
 *     summary: Cancelar chamado
 *     description: Somente quem abriu o chamado pode cancelá-lo enquanto estiver aberto e sem técnico atribuído.
 *     tags:
 *       - Chamados
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *         example: 15
 *     responses:
 *       '200':
 *         description: Chamado cancelado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chamado'
 *       '400':
 *         description: ID inválido.
 *       '401':
 *         description: Token ausente ou inválido.
 *       '403':
 *         description: Apenas quem abriu o chamado pode cancelá-lo.
 *       '404':
 *         description: Chamado não encontrado.
 *       '409':
 *         description: O chamado não está aberto ou já possui técnico atribuído.
 */

const router = Router();

router.use('/chamados', autenticar);

// Cada ação possui sua própria rota.

router.post(
  '/chamados',
  validate(criarChamadoSchema),
  ChamadoController.criar,
);

router.get(
  '/chamados',
  validate(listarChamadosSchema),
  ChamadoController.listar,
);

router.get(
  '/chamados/:id',
  validate(idChamadoSchema),
  ChamadoController.buscar,
);

router.post(
  '/chamados/:id/atribuir',
  exigirPerfil('administrador'),
  validate(atribuirChamadoSchema),
  ChamadoController.atribuir,
);

router.patch(
  '/chamados/:id/prioridade',
  exigirPerfil('administrador'),
  validate(alterarPrioridadeSchema),
  ChamadoController.alterarPrioridade,
);

router.post(
  '/chamados/:id/iniciar',
  exigirPerfil('tecnico'),
  validate(idChamadoSchema),
  ChamadoController.iniciar,
);

router.post(
  '/chamados/:id/devolver',
  exigirPerfil('tecnico'),
  validate(devolverChamadoSchema),
  ChamadoController.devolver,
);

router.post(
  '/chamados/:id/resolver',
  exigirPerfil('tecnico'),
  validate(resolverChamadoSchema),
  ChamadoController.resolver,
);

router.post(
  '/chamados/:id/cancelar',
  validate(idChamadoSchema),
  ChamadoController.cancelar,
);

export default router;