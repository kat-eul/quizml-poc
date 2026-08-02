import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseQuizFile, QuizParseError, QuizYamlSyntaxError, type Quiz } from '@quiz-engine/core';

/**
 * Résout le fichier .quiz.yml à charger :
 *   - si explicitPath est fourni (ex: argument CLI), on l'utilise tel quel
 *   - sinon on cherche le premier *.quiz.yml dans quizzesDir
 *
 * Les erreurs de parsing sont volontairement affichées de façon lisible dans
 * la console (pas de stack trace) puisque c'est l'animateur, pas un
 * développeur, qui verra ce message s'il a une faute dans son fichier.
 */
export function resolveQuizPath(quizzesDir: string, explicitPath?: string): string {
  if (explicitPath) return resolve(explicitPath);

  const files = readdirSync(quizzesDir).filter((f) => f.endsWith('.quiz.yml'));
  if (files.length === 0) {
    throw new Error(`Aucun fichier .quiz.yml trouvé dans '${quizzesDir}'.`);
  }
  if (files.length > 1) {
    throw new Error(
      `Plusieurs fichiers .quiz.yml trouvés dans '${quizzesDir}' (${files.join(', ')}). ` +
        'Précise lequel charger, ex: npm run dev -- ./quizzes/mon-quiz.quiz.yml'
    );
  }
  return join(quizzesDir, files[0]);
}

export function loadQuizOrExit(path: string): Quiz {
  try {
    return parseQuizFile(path);
  } catch (err) {
    if (err instanceof QuizParseError) {
      console.error(`\n❌ Le fichier '${path}' contient des erreurs :\n`);
      for (const issue of err.issues) console.error(`  - ${issue}`);
      console.error('');
    } else if (err instanceof QuizYamlSyntaxError) {
      console.error(`\n❌ ${err.message}\n`);
    } else {
      console.error(`\n❌ Erreur inattendue lors du chargement de '${path}' :`, err);
    }
    process.exit(1);
  }
}
