// Arquivo: src/routes/avaliacao.route.ts

import { Router } from 'express';

import { AvaliacaoController } from '../controllers/avaliacao.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { avaliarChamadoSchema } from '../schemas/avaliacao.schema.js';

/**
 * @openapi
 * components:
 *   schemas:
 *
 *     CriarAvaliacao:
 *       type: object
 *       additionalProperties: false
 *       required:
 *         - nota
 *       properties:
 *         nota:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           example: 5
 *           description: Nota atribuída ao atendimento, de 1 a 5.
 *         comentario:
 *           type: string
 *           nullable: true
 *           maxLength: 1000
 *           example: Atendimento excelente e resolveu meu problema rapidamente.
 *           description: Comentário opcional sobre o atendimento.
 *
 *     Avaliacao:
 *       type: object
 *       properties:
 *         chamadoId:
 *           type: integer
 *           format: int64
 *           example: 15
 *         avaliadorId:
 *           type: string
 *           format: uuid
 *           example: 550e8400-e29b-41d4-a716-446655440000
 *         nota:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           example: 5
 *         comentario:
 *           type: string
 *           nullable: true
 *           example: Atendimento excelente e resolveu meu problema rapidamente.
 *         criadoEm:
 *           type: string
 *           format: date-time
 *           example: 2026-10-05T20:30:00.000Z
 *
 * /chamados/{id}/avaliacao:
 *   post:
 *     summary: Avaliar um chamado
 *     description: Permite que o solicitante avalie um chamado que foi resolvido.
 *     tags:
 *       - Avaliações
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do chamado que será avaliado.
 *         schema:
 *           type: integer
 *           format: int64
 *           minimum: 1
 *         example: 15
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CriarAvaliacao'
 *     responses:
 *       '201':
 *         description: Avaliação criada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Avaliacao'
 *       '400':
 *         description: Dados da avaliação inválidos.
 *       '401':
 *         description: Token ausente ou inválido.
 *       '403':
 *         description: Apenas o solicitante do chamado pode realizar a avaliação.
 *       '404':
 *         description: Chamado não encontrado.
 *       '409':
 *         description: Chamado ainda não foi resolvido ou já possui uma avaliação.
 */

const router = Router();

router.post(
  '/chamados/:id/avaliacao',
  autenticar,
  validate(avaliarChamadoSchema),
  AvaliacaoController.avaliar,
);

export default router;