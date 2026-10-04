// Arquivo: src/middlewares/validate.middleware.ts
import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';

// Valida { body, params, query } contra o schema. Se algo estiver errado, responde 400
// no mesmo formato do restante da API: { error, detalhes }.
export const validate = (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
  const resultado = schema.safeParse({ body: req.body, params: req.params, query: req.query });

  if (!resultado.success) {
    const detalhes = resultado.error.issues.map((i) => ({
      campo: i.path.slice(1).join('.'), // tira o "body"/"params" do começo
      mensagem: i.message,
    }));
    return res.status(400).json({ error: 'Dados inválidos.', detalhes });
  }

  // Passa a diante o corpo já limpo (e-mail em minúsculas, textos aparados, campos extras removidos).
  const dados = resultado.data as { body?: unknown };
  if (dados.body !== undefined) req.body = dados.body;
  next();
};