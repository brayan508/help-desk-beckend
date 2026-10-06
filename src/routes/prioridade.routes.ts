// Arquivo: src/routes/prioridade.route.ts

import { Router } from 'express';

import { PrioridadeController } from '../controllers/prioridade.controllers.js';

import { autenticar } from '../middlewares/auth.middleware.js';

/**
 * @openapi
 * components:
 *   schemas:
 *     Prioridade:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nome:
 *           type: string
 *           example: Alta
 *         slaHoras:
 *           type: integer
 *           example: 4
 *         peso:
 *           type: integer
 *           example: 3
 *         ativa:
 *           type: boolean
 *           example: true
 *
 * /prioridades:
 *   get:
 *     summary: Listar prioridades
 *     description: Retorna todas as prioridades cadastradas no sistema.
 *     tags:
 *       - Prioridades
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista de prioridades retornada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Prioridade'
 *       '401':
 *         description: Token ausente, inválido ou usuário não autenticado.
 *       '500':
 *         description: Erro interno do servidor.
 */

const router = Router();

router.use('/prioridades', autenticar);

router.get('/prioridades', PrioridadeController.listar);

export default router;