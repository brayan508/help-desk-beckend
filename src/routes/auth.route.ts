// Arquivo: src/routes/auth.route.ts  — rotas públicas
import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { AuthController } from '../controllers/auth.controllers.js';
import { validate } from '../middlewares/validate.middleware.js';
import { cadastroSchema } from '../schemas/user.schema.js';
import { loginSchema } from '../schemas/auth.schema.js';

const router = Router();

router.post('/cadastro', validate(cadastroSchema), UserController.createUser);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/logout', AuthController.logout);

export default router;