import type { Perfil } from '../services/user.service.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        perfil: Perfil;
      };
    }
  }
}

export {};