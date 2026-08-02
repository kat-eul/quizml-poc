# @quiz-engine/core — Parser

Étape 1 du moteur de quiz : parsing + validation + normalisation d'un fichier `.quiz.yml`.

## Installation

```bash
cd packages/core
npm install
```

## Utilisation

```typescript
import { parseQuizFile, QuizParseError } from '@quiz-engine/core';

try {
  const quiz = parseQuizFile('../../examples/gender-reveal.quiz.yml');
  console.log(quiz.title, quiz.questions.length);
} catch (err) {
  if (err instanceof QuizParseError) {
    // err.issues est un tableau de messages lisibles, un par problème détecté
    console.error(err.issues.join('\n'));
  } else {
    throw err;
  }
}
```

## Tests

```bash
npm test
```

Les tests couvrent :
- le parsing complet d'un quiz valide (`examples/gender-reveal.quiz.yml`) avec les 6 types de questions
- la génération automatique des `id` de question quand ils sont absents
- l'application des valeurs par défaut (`points`, `max_players`, etc.)
- les messages d'erreur lisibles sur un fichier invalide (`examples/invalid.quiz.yml`) : question `choice` sans réponse correcte, `range.min >= range.max`
- les erreurs de syntaxe YAML brute

## Pipeline

```
texte YAML
   │  parseYamlText()      (js-yaml)
   ▼
objet JS brut
   │  validateSchema()     (zod — quizFileSchema)
   ▼
objet validé (snake_case, proche du YAML)
   │  normalizeQuiz()
   ▼
Quiz (modèle interne, camelCase, ids garantis)
```

Le fichier `src/parser/errors.ts` retraduit chaque erreur Zod en une phrase
compréhensible par quelqu'un qui écrit du YAML à la main (sans jamais montrer
une stack trace Zod brute), en identifiant si possible la question concernée
par son `id`, son `type` et son `title`.

## Prochaine étape

Une fois ce parser validé, l'étape suivante est `core/engine` : la machine à
états du jeu (lobby → question → correction → classement → fin) qui
consomme l'objet `Quiz` produit ici.
