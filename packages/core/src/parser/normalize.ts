import type { QuizFileInput, QuestionInput } from './schema.js';
import type { Quiz, Question } from '../models/quiz.js';

/**
 * Transforme la sortie validée par Zod (encore proche de la forme YAML,
 * snake_case, ids optionnels) en modèle interne (camelCase, ids garantis,
 * valeurs par défaut déjà appliquées par Zod).
 *
 * C'est la SEULE fonction du projet qui a le droit de générer un id de
 * question à partir de son index — partout ailleurs, un id de question
 * doit déjà exister.
 */
export function normalizeQuiz(input: QuizFileInput): Quiz {
  return {
    title: input.quiz.title,
    description: input.quiz.description,
    theme: input.quiz.theme,
    settings: {
      maxPlayers: input.quiz.settings.max_players,
      mode: input.quiz.settings.mode,
      showAnswers: input.quiz.settings.show_answers,
    },
    teamsEnabled: input.teams?.enabled ?? false,
    questions: input.questions.map((q, index) => normalizeQuestion(q, index)),
  };
}

function generateId(index: number): string {
  return `q${index + 1}`;
}

function normalizeQuestion(q: QuestionInput, index: number): Question {
  const id = q.id ?? generateId(index);
  const base = { id, title: q.title, points: q.points };

  switch (q.type) {
    case 'boolean':
      return { ...base, type: 'boolean', answer: q.answer };

    case 'choice':
      return { ...base, type: 'choice', multiple: q.multiple, options: q.options };

    case 'image':
      return { ...base, type: 'image', media: q.media, answer: q.answer };

    case 'text':
      return {
        ...base,
        type: 'text',
        validation: {
          mode: q.validation.mode,
          accepted: q.validation.accepted,
          fuzzyMatching: q.validation.fuzzy_matching,
        },
      };

    case 'number':
      return { ...base, type: 'number', range: q.range, answer: q.answer };

    case 'music':
      return { ...base, type: 'music', media: q.media, answer: q.answer };

    default: {
      // Exhaustivité : si un type de question est ajouté au schéma sans être
      // géré ici, TypeScript refusera de compiler cette ligne.
      const _exhaustive: never = q;
      throw new Error(`Type de question non géré par le normalizer: ${JSON.stringify(_exhaustive)}`);
    }
  }
}
