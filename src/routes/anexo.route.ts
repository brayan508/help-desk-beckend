// Arquivo: src/routes/anexo.route.ts

import { Router } from 'express';

import { AnexoController } from '../controllers/anexo.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { uploadAnexo } from '../middlewares/upload.middleware.js';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *
 *     Anexo:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           example: 1
 *         chamadoId:
 *           type: integer
 *           format: int64
 *           example: 15
 *         enviadoPor:
 *           type: string
 *           format: uuid
 *           example: 550e8400-e29b-41d4-a716-446655440000
 *         nomeArquivo:
 *           type: string
 *           example: comprovante.pdf
 *         tipoMime:
 *           type: string
 *           example: application/pdf
 *         tamanhoBytes:
 *           type: integer
 *           format: int64
 *           example: 248532
 *         caminho:
 *           type: string
 *           example: uploads/chamados/1728159283746-483729182.pdf
 *         criadoEm:
 *           type: string
 *           format: date-time
 *           example: 2026-10-05T20:30:00.000Z
 *
 * /chamados/{id}/anexos:
 *   post:
 *     summary: Enviar anexo para um chamado
 *     description: Envia um arquivo para um chamado. Administradores, solicitantes e técnicos atribuídos podem anexar arquivos.
 *     tags:
 *       - Anexos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do chamado que receberá o arquivo.
 *         schema:
 *           type: integer
 *           format: int64
 *           minimum: 1
 *         example: 15
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - arquivo
 *             properties:
 *               arquivo:
 *                 type: string
 *                 format: binary
 *                 description: Arquivo que será anexado ao chamado. Limite de 10 MB.
 *     responses:
 *       '201':
 *         description: Arquivo enviado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Anexo'
 *       '400':
 *         description: Nenhum arquivo foi enviado ou dados inválidos.
 *       '401':
 *         description: Token ausente ou inválido.
 *       '403':
 *         description: Usuário não possui permissão para anexar arquivos neste chamado.
 *       '404':
 *         description: Chamado não encontrado.
 *       '413':
 *         description: Arquivo maior que o limite permitido.
 *       '415':
 *         description: Tipo de arquivo não permitido.
 */

router.post(
  '/chamados/:id/anexos',
  autenticar,
  uploadAnexo.single('arquivo'),
  AnexoController.criar,
);

export default router;