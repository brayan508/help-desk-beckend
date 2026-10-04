// Arquivo: src/routes/index.ts
import { Router } from 'express';
import authRoutes from './auth.route.js';
import userRoutes from './user.route.js';

const router = Router();

router.use(authRoutes); // /cadastro, /login   (públicas)
router.use(userRoutes); // /me, /usuarios...   (exigem login)

export default router;