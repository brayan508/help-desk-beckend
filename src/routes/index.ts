// Arquivo: src/routes/index.ts
import { Router } from 'express';
import authRoutes from './auth.route.js';
import userRoutes from './user.route.js';
import categoriaRoutes from './categoria.routes.js';
import prioridadeRoutes from './prioridade.routes.js';
import chamadoRoutes from './chamado.route.js';

const router = Router();

router.use(authRoutes);       // /cadastro, /login, /logout   (públicas)
router.use(userRoutes);       // /me, /usuarios...            (exigem login)
router.use(categoriaRoutes);  // /categorias
router.use(prioridadeRoutes); // /prioridades
router.use(chamadoRoutes);    // /chamados

export default router;