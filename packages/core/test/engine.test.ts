import { describe, it, expect, beforeEach } from 'vitest';
import type { Quiz } from '../src/models/quiz';
import { GameEngine, GameEngineError } from '../src/engine';

function buildQuiz(overrides: Partial<Quiz> = {}): Quiz {
  return {
    title: 'Quiz de test',
    settings: { maxPlayers: 3, mode: 'individual', showAnswers: 'manual' },
    teamsEnabled: false,
    questions: [
      { id: 'q1', title: 'Vrai ou faux ?', type: 'boolean', answer: true, points: 1 },
      {
        id: 'q2',
        title: 'Choix multiple',
        type: 'choice',
        multiple: true,
        points: 2,
        options: [
          { text: 'Emma', correct: true },
          { text: 'Louise', correct: true },
          { text: 'Alice', correct: false },
        ],
      },
      {
        id: 'q3',
        title: 'Prénom (manuel)',
        type: 'text',
        points: 3,
        validation: { mode: 'manual' },
      },
    ],
    ...overrides,
  };
}

describe('GameEngine — cycle de vie et scoring de base', () => {
  let engine: GameEngine;
  let alice: ReturnType<GameEngine['addPlayer']>;

  beforeEach(() => {
    engine = new GameEngine(buildQuiz());
    alice = engine.addPlayer('Alice');
  });

  it('démarre en lobby et n\'accepte pas les réponses avant startGame', () => {
    expect(engine.getSnapshot().state).toBe('lobby');
    const result = engine.submitAnswer(alice.id, true);
    expect(result.accepted).toBe(false);
  });

  it('refuse de dépasser max_players', () => {
    engine.addPlayer('Bob');
    engine.addPlayer('Charlie');
    expect(() => engine.addPlayer('Dave')).toThrow(GameEngineError);
  });

  it('score correctement une question boolean', () => {
    engine.startGame();
    const result = engine.submitAnswer(alice.id, true);
    expect(result.isCorrect).toBe(true);
    expect(engine.getLeaderboard()[0].score).toBe(1);
  });

  it('refuse une double réponse du même joueur', () => {
    engine.startGame();
    engine.submitAnswer(alice.id, true);
    const second = engine.submitAnswer(alice.id, false);
    expect(second.accepted).toBe(false);
  });

  it('respecte le cycle question_active → question_locked → correction → question suivante', () => {
    engine.startGame();
    engine.submitAnswer(alice.id, true);
    engine.lockCurrentQuestion();
    expect(engine.getSnapshot().state).toBe('question_locked');

    // plus de réponses acceptées une fois verrouillée
    const bob = engine.addPlayer('Bob');
    expect(engine.submitAnswer(bob.id, true).accepted).toBe(false);

    engine.enterCorrection();
    expect(engine.getSnapshot().state).toBe('correction');

    engine.nextQuestion();
    expect(engine.getSnapshot().state).toBe('question_active');
    expect(engine.getSnapshot().currentQuestionIndex).toBe(1);
  });

  it('termine la partie après la dernière question', () => {
    engine.startGame();
    for (let i = 0; i < 3; i++) {
      engine.lockCurrentQuestion();
      engine.enterCorrection();
      if (i < 2) engine.nextQuestion();
    }
    engine.nextQuestion();
    expect(engine.getSnapshot().state).toBe('finished');
  });
});

describe('GameEngine — choix multiple', () => {
  it('valide uniquement si l\'ensemble sélectionné correspond exactement aux bonnes réponses', () => {
    const engine = new GameEngine(buildQuiz());
    const alice = engine.addPlayer('Alice');
    engine.startGame();
    engine.lockCurrentQuestion();
    engine.enterCorrection();
    engine.nextQuestion(); // → q2 (choice, multiple)

    const partial = engine.submitAnswer(alice.id, ['Emma']);
    expect(partial.isCorrect).toBe(false);
  });

  it('accepte quand toutes les bonnes options sont cochées et aucune mauvaise', () => {
    const engine = new GameEngine(buildQuiz());
    const alice = engine.addPlayer('Alice');
    engine.startGame();
    engine.lockCurrentQuestion();
    engine.enterCorrection();
    engine.nextQuestion(); // → q2

    const result = engine.submitAnswer(alice.id, ['Emma', 'Louise']);
    expect(result.isCorrect).toBe(true);
    expect(engine.getLeaderboard()[0].score).toBe(2);
  });
});

describe('GameEngine — validation manuelle (text)', () => {
  function toQuestion3(engine: GameEngine) {
    engine.startGame();
    engine.lockCurrentQuestion();
    engine.enterCorrection();
    engine.nextQuestion(); // q2
    engine.lockCurrentQuestion();
    engine.enterCorrection();
    engine.nextQuestion(); // q3 (text manuel)
  }

  it('n\'attribue aucun point tant que l\'animateur n\'a pas validé', () => {
    const engine = new GameEngine(buildQuiz());
    const alice = engine.addPlayer('Alice');
    toQuestion3(engine);

    const result = engine.submitAnswer(alice.id, 'Léa');
    expect(result.isCorrect).toBeUndefined();
    expect(engine.getLeaderboard()[0].score).toBe(0);
  });

  it('empêche de passer à la suite tant qu\'une réponse manuelle est en attente', () => {
    const engine = new GameEngine(buildQuiz());
    const alice = engine.addPlayer('Alice');
    toQuestion3(engine);
    engine.submitAnswer(alice.id, 'Léa');
    engine.lockCurrentQuestion();
    engine.enterCorrection();

    expect(() => engine.nextQuestion()).toThrow(GameEngineError);
  });

  it('valide individuellement chaque joueur et ajuste le score si l\'animateur change d\'avis', () => {
    const engine = new GameEngine(buildQuiz());
    const alice = engine.addPlayer('Alice');
    toQuestion3(engine);
    engine.submitAnswer(alice.id, 'Léa');
    engine.lockCurrentQuestion();
    engine.enterCorrection();

    engine.validateManualAnswer(alice.id, true);
    expect(engine.getLeaderboard()[0].score).toBe(3);

    // l'animateur se ravise
    engine.validateManualAnswer(alice.id, false);
    expect(engine.getLeaderboard()[0].score).toBe(0);
  });
});

describe('GameEngine — joueur qui rejoint en retard', () => {
  it('est accepté avec un score de départ à 0', () => {
    const engine = new GameEngine(buildQuiz());
    const alice = engine.addPlayer('Alice');
    engine.startGame();
    engine.submitAnswer(alice.id, true); // Alice score 1 point

    const bob = engine.addPlayer('Bob'); // rejoint après le début de la partie
    expect(bob.score).toBe(0);
    expect(engine.getSnapshot().players).toHaveLength(2);
  });
});

describe('GameEngine — équipes', () => {
  it('cumule les points au niveau équipe quand un joueur marque', () => {
    const engine = new GameEngine(buildQuiz({ teamsEnabled: true }));
    const teamA = engine.addTeam('Équipe A');
    const alice = engine.addPlayer('Alice', teamA.id);
    engine.startGame();
    engine.submitAnswer(alice.id, true);

    expect(engine.getTeamLeaderboard()[0].score).toBe(1);
  });
});
