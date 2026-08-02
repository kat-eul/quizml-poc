import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parseQuizString } from '../src/parser';
import { QuizParseError, QuizYamlSyntaxError } from '../src/parser/errors';

const __dirname = dirname(fileURLToPath(import.meta.url));
const examplesDir = resolve(__dirname, '../../../examples');

function loadExample(name: string): string {
  return readFileSync(resolve(examplesDir, name), 'utf-8');
}

describe('parseQuizString — cas valide', () => {
  const quiz = parseQuizString(loadExample('gender-reveal.quiz.yml'));

  it('parse le titre et les settings', () => {
    expect(quiz.title).toBe('Gender Reveal de Julie & Thomas');
    expect(quiz.settings.mode).toBe('individual');
    expect(quiz.settings.maxPlayers).toBe(10);
  });

  it('parse les 6 questions avec leurs ids', () => {
    expect(quiz.questions).toHaveLength(6);
    expect(quiz.questions.map((q) => q.id)).toEqual(['q1', 'q2', 'q3', 'q4', 'q5', 'q6']);
  });

  it('parse correctement une question boolean', () => {
    const q = quiz.questions[0];
    expect(q.type).toBe('boolean');
    if (q.type === 'boolean') expect(q.answer).toBe(true);
  });

  it('parse correctement une question choice multiple', () => {
    const q = quiz.questions[1];
    expect(q.type).toBe('choice');
    if (q.type === 'choice') {
      expect(q.multiple).toBe(true);
      expect(q.options.filter((o) => o.correct)).toHaveLength(2);
    }
  });

  it('parse correctement une question text avec fuzzy matching (camelCase)', () => {
    const q = quiz.questions[3];
    expect(q.type).toBe('text');
    if (q.type === 'text') {
      expect(q.validation.fuzzyMatching).toBe(true);
      expect(q.validation.accepted).toContain('Léa');
    }
  });

  it('parse correctement une question music', () => {
    const q = quiz.questions[5];
    expect(q.type).toBe('music');
    if (q.type === 'music') {
      expect(q.media.type).toBe('youtube');
      expect(q.answer.mode).toBe('choice');
    }
  });

  it('applique les valeurs par défaut (id généré si absent)', () => {
    const yamlText = `
quiz:
  title: "Sans id"
questions:
  - type: boolean
    title: "Vrai ou faux ?"
    answer: true
`;
    const q = parseQuizString(yamlText);
    expect(q.questions[0].id).toBe('q1');
    expect(q.questions[0].points).toBe(1); // valeur par défaut
    expect(q.settings.maxPlayers).toBe(20); // valeur par défaut
  });
});

describe('parseQuizString — cas invalides', () => {
  it('rejette une question choice sans option correcte', () => {
    expect(() => parseQuizString(loadExample('invalid.quiz.yml'))).toThrow(QuizParseError);

    try {
      parseQuizString(loadExample('invalid.quiz.yml'));
    } catch (err) {
      const parseErr = err as QuizParseError;
      expect(parseErr.issues.some((i) => i.includes('correct: true'))).toBe(true);
      expect(parseErr.issues.some((i) => i.includes("question 'q1'"))).toBe(true);
    }
  });

  it('rejette un range min >= max', () => {
    try {
      parseQuizString(loadExample('invalid.quiz.yml'));
    } catch (err) {
      const parseErr = err as QuizParseError;
      expect(parseErr.issues.some((i) => i.includes("question 'q2'"))).toBe(true);
    }
  });

  it('rejette un quiz sans titre', () => {
    const yamlText = `
quiz: {}
questions:
  - type: boolean
    title: "Test"
    answer: true
`;
    expect(() => parseQuizString(yamlText)).toThrow(QuizParseError);
  });

  it('rejette un quiz sans question', () => {
    const yamlText = `
quiz:
  title: "Vide"
questions: []
`;
    expect(() => parseQuizString(yamlText)).toThrow(QuizParseError);
  });

  it('rejette un YAML syntaxiquement invalide', () => {
    const brokenYaml = `
quiz:
  title: "Oups
questions: [
`;
    expect(() => parseQuizString(brokenYaml)).toThrow(QuizYamlSyntaxError);
  });
});
