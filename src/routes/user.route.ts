// Arquivo: src/routes/user.route.ts  — rotas que exigem login
import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { autenticar, exigirPerfil } from '../middlewares/auth.middleware.js';
import {
  atualizarPerfilSchema,
  trocarSenhaSchema,
  userIdSchema,
  aprovarSchema,
} from '../schemas/user.schema.js';

const router = Router();

// Exige login só nestes caminhos (assim, caminhos que não existem continuam dando 404, não 401).
router.use(['/me', '/usuarios'], autenticar);

// --- A própria pessoa (qualquer perfil) ---
router.get('/me', UserController.getMe);
router.patch('/me', validate(atualizarPerfilSchema), UserController.updateMe);
router.put('/me/senha', validate(trocarSenhaSchema), UserController.changeMyPassword);

// --- Administrador ---
router.get('/usuarios', exigirPerfil('administrador'), UserController.getAllUsers);
router.post('/usuarios/:id/aprovar', exigirPerfil('administrador'), validate(aprovarSchema), UserController.approveUser);
router.post('/usuarios/:id/desativar', exigirPerfil('administrador'), validate(userIdSchema), UserController.deactivateUser);

// --- Administrador ou a própria pessoa (o controller confere) ---
router.get('/usuarios/:id', validate(userIdSchema), UserController.getUserById);

export default router;