// Arquivo: src/app.ts
import express from 'express';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';
import { corsMiddleware } from './middlewares/cors.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';

export const app = express();
app.use(corsMiddleware);
app.use(cookieParser());
app.use(express.json({ limit: '16kb' }));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use(routes); // /cadastro, /login, /logout, /me, /usuarios...
app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
app.use(errorHandler);