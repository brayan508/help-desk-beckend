import {z} from 'zod';

export const criarAvaliacaoSchema = z.object({
    nota: z
    .number()
    .int()
    .min(1)
    .max(5, {message: "A nota deve ser um número inteiro entre 1 e 5."}),

    comentario: z
    .string()
    .max(500, {message: "O comentário deve ter no máximo 500 caracteres."}).optional(),

});