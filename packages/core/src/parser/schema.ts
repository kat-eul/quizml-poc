import { z } from 'zod';

/**
 * Schéma Zod représentant la forme BRUTE du fichier .quiz.yml, telle qu'écrite
 * par l'utilisateur (avant génération des ids manquants, avant valeurs par défaut).
 * C'est la source de vérité pour la validation ET pour les types TypeScript
 * correspondants (via z.infer), afin d'éviter toute désynchronisation.
 */

const choiceOptionSchema = z.object({
  text: z.string().min(1, "le texte de l'option ne peut pas être vide"),
  correct: z.boolean().default(false),
});

const baseQuestionSchema = z.object({
  id: z.string().optional(), // généré automatiquement si absent, voir normalize.ts
  title: z.string().min(1, 'le titre de la question est obligatoire'),
  points: z.number().positive().default(1),
});

const booleanQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('boolean'),
  answer: z.boolean(),
});

const choiceQuestionSchema = baseQuestionSchema
  .extend({
    type: z.literal('choice'),
    multiple: z.boolean().default(false),
    options: z.array(choiceOptionSchema).min(2, 'il faut au moins 2 options'),
  });

const mediaImageSchema = z.object({
  type: z.literal('image'),
  source: z.string().min(1),
});

const imageQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('image'),
  media: mediaImageSchema,
  answer: z.object({
    accepted: z.array(z.string().min(1)).min(1, 'au moins une réponse acceptée est requise'),
  }),
});

const textValidationSchema = z
  .object({
    mode: z.enum(['automatic', 'manual']),
    accepted: z.array(z.string().min(1)).optional(),
    fuzzy_matching: z.boolean().optional().default(false),
  })
  .refine((v) => v.mode === 'manual' || (v.accepted && v.accepted.length > 0), {
    message: "en mode 'automatic', il faut au moins une réponse dans 'accepted'",
    path: ['accepted'],
  });

const textQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('text'),
  validation: textValidationSchema,
});

const numberQuestionSchema = baseQuestionSchema
  .extend({
    type: z.literal('number'),
    range: z.object({ min: z.number(), max: z.number() }),
    answer: z.object({
      value: z.number(),
      tolerance: z.number().nonnegative(),
    }),
  });

const musicClipSchema = z.object({
  start: z.number().nonnegative(),
  duration: z.number().positive(),
});

const musicMediaSchema = z
  .object({
    type: z.enum(['youtube', 'audio']),
    url: z.string().optional(),
    source: z.string().optional(),
    clip: musicClipSchema.optional(),
  })
  .refine((m) => (m.type === 'youtube' ? !!m.url : !!m.source), {
    message: "media.url requis pour type 'youtube', media.source requis pour type 'audio'",
  });

const musicAnswerSchema = z
  .object({
    mode: z.enum(['choice', 'text']),
    options: z.array(choiceOptionSchema).optional(),
    accepted: z.array(z.string().min(1)).optional(),
  })
  .refine((a) => (a.mode === 'choice' ? !!a.options?.length : !!a.accepted?.length), {
    message: "en mode 'choice' il faut 'options', en mode 'text' il faut 'accepted'",
  });

const musicQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('music'),
  media: musicMediaSchema,
  answer: musicAnswerSchema,
});

export const questionSchema = z
    .discriminatedUnion('type', [
        booleanQuestionSchema,
        choiceQuestionSchema,
        imageQuestionSchema,
        textQuestionSchema,
        numberQuestionSchema,
        musicQuestionSchema,
    ])
    .superRefine((q, ctx) => {
        if (q.type === 'choice' && !q.options.some((o) => o.correct)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'au moins une option doit être marquée correct: true',
                path: ['options'],
            });
        }

        if (q.type === 'number') {
            if (q.range.min >= q.range.max) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'range.min doit être strictement inférieur à range.max',
                    path: ['range'],
                });
            }
            if (q.answer.value < q.range.min || q.answer.value > q.range.max) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'answer.value doit être compris dans range',
                    path: ['answer', 'value'],
                });
            }
        }
    });

const settingsSchema = z.object({
  max_players: z.number().int().positive().default(20),
  mode: z.enum(['individual', 'team']).default('individual'),
  show_answers: z.enum(['manual', 'automatic']).default('manual'),
});

const teamsSchema = z.object({
  enabled: z.boolean().default(false),
});

export const quizFileSchema = z.object({
  quiz: z.object({
    title: z.string().min(1, 'quiz.title est obligatoire'),
    description: z.string().optional(),
    theme: z.string().optional(),
    settings: settingsSchema.default({}),
  }),
  teams: teamsSchema.optional().default({ enabled: false }),
  questions: z.array(questionSchema).min(1, 'le quiz doit contenir au moins une question'),
});

export type QuizFileInput = z.infer<typeof quizFileSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
