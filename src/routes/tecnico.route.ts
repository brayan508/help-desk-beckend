// Arquivo: src/routes/tecnico.route.ts

import { Router } from 'express';

import { AvaliacaoController } from '../controllers/avaliacao.controller.js';

import { validate } from '../middlewares/validate.middleware.js';

import {
  autenticar,
  exigirPerfil,
} from '../middlewares/auth.middleware.js';

import { listarAvaliacoesSchema } from '../schemas/avaliacao.schema.js';

/**
 * @openapi
 * components:
 *   schemas:
 *     AvaliacoesTecnicoResponse:
 *       type: object
 *       properties:
 *         tecnico:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             nome:
 *               type: string
 *               example: João da Silva
 *         resumo:
 *           type: object
 *           properties:
 *             resolvidos:
 *               type: integer
 *               example: 25
 *             avaliados:
 *               type: integer
 *               example: 20
 *             media:
 *               type: number
 *               format: float
 *               nullable: true
 *               example: 4.7
 *             distribuicao:
 *               type: object
 *               properties:
 *                 "1":
 *                   type: integer
 *                   example: 0
 *                 "2":
 *                   type: integer
 *                   example: 1
 *                 "3":
 *                   type: integer
 *                   example: 2
 *                 "4":
 *                   type: integer
 *                   example: 5
 *                 "5":
 *                   type: integer
 *                   example: 12
 *         avaliacoes:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               chamado:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     format: int64
 *                     example: 15
 *                   titulo:
 *                     type: string
 *                     example: Computador não liga
 *               nota:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               comentario:
 *                 type: string
 *                 nullable: true
 *                 example: Atendimento excelente.
 *               solicitante:
 *                 type: string
 *                 example: Maria Silva
 *               criadoEm:
 *                 type: string
 *                 format: date-time
 *
 * /tecnicos/{id}/avaliacoes:
 *   get:
 *     summary: Listar avaliações de um técnico
 *     description: |
 *       Retorna o resumo e o histórico de avaliações recebidas por um técnico.
 *       Administradores podem consultar qualquer técnico.
 *       Técnicos podem consultar apenas as próprias avaliações.
 *     tags:
 *       - Técnicos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do técnico
 *         schema:
 *           type: string
 *           format: uuid
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       '200':
 *         description: Avaliações do técnico retornadas com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AvaliacoesTecnicoResponse'
 *       '400':
 *         description: ID ou parâmetros inválidos.
 *       '401':
 *         description: É necessário estar autenticado.
 *       '403':
 *         description: Usuário sem permissão para consultar as avaliações.
 *       '404':
 *         description: Técnico não encontrado.
 */
const router = Router();

router.use('/tecnicos', autenticar);

// Só técnico e administrador.
// O service verifica se o técnico está consultando apenas as próprias avaliações.
router.get('/tecnicos/:id/avaliacoes', exigirPerfil('tecnico', 'administrador'), validate(listarAvaliacoesSchema), AvaliacaoController.listarDoTecnico,
);

export default router;