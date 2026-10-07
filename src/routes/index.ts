// Arquivo: src/routes/index.ts

import { Router } from 'express';

import authRoutes from './auth.route.js';
import userRoutes from './user.route.js';
import categoriaRoutes from './categoria.routes.js';
import prioridadeRoutes from './prioridade.routes.js';
import chamadoRoutes from './chamado.route.js';
import anexoRoutes from './anexo.route.js';

const router = Router();

router.use(authRoutes);
router.use(userRoutes);
router.use(categoriaRoutes);
router.use(prioridadeRoutes);
router.use(chamadoRoutes);
router.use(anexoRoutes);

export default router;