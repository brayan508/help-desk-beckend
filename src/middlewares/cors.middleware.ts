// Arquivo: src/middlewares/cors.middleware.ts
import cors from 'cors';
import { env } from '../config/env.js';

// Diz ao navegador quais sites podem ler as respostas da API e enviar cookies.
// Atenção: o tutorial original não lista PATCH, mas a rota PATCH /me existe aqui.
export const corsMiddleware = cors({
  origin: [env.FRONTEND_ORIGIN, env.API_ORIGIN],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});