/**
 * Modèle de données interne du moteur de quiz.
 * Ces types représentent un quiz APRÈS parsing, validation et normalisation
 * du fichier .quiz.yml — jamais avant. Le reste de l'application (moteur de
 * jeu, serveur, UI) ne doit connaître QUE ces types, jamais la forme brute du YAML.
 */

export type QuestionType = 'boolean' | 'choice' | 'image' | 'text' | 'number' | 'music';

export type GameMode = 'individual' | 'team';
export type AnswerRevealMode = 'manual' | 'automatic';

export interface QuizSettings {
  maxPlayers: number;
  mode: GameMode;
  showAnswers: AnswerRevealMode;
}

export interface Quiz {
  title: string;
  description?: string;
  theme?: string;
  settings: QuizSettings;
  teamsEnabled: boolean;
  questions: Question[];
}

export interface BaseQuestion {
  id: string;
  title: string;
  points: number;
}

export interface ChoiceOption {
  text: string;
  correct: boolean;
}

export interface MediaImageRef {
  type: 'image';
  source: string;
}

export interface TextValidation {
  mode: 'automatic' | 'manual';
  accepted?: string[];
  fuzzyMatching?: boolean;
}

export interface MusicClip {
  start: number;
  duration: number;
}

export interface MusicMedia {
  type: 'youtube' | 'audio';
  url?: string;
  source?: string;
  clip?: MusicClip;
}

export interface MusicAnswer {
  mode: 'choice' | 'text';
  options?: ChoiceOption[];
  accepted?: string[];
}

export interface BooleanQuestion extends BaseQuestion {
  type: 'boolean';
  answer: boolean;
}

export interface ChoiceQuestion extends BaseQuestion {
  type: 'choice';
  multiple: boolean;
  options: ChoiceOption[];
}

export interface ImageQuestion extends BaseQuestion {
  type: 'image';
  media: MediaImageRef;
  answer: { accepted: string[] };
}

export interface TextQuestion extends BaseQuestion {
  type: 'text';
  validation: TextValidation;
}

export interface NumberQuestion extends BaseQuestion {
  type: 'number';
  range: { min: number; max: number };
  answer: { value: number; tolerance: number };
}

export interface MusicQuestion extends BaseQuestion {
  type: 'music';
  media: MusicMedia;
  answer: MusicAnswer;
}

/**
 * Union discriminée sur `type`. Permet un `switch (question.type)` exhaustif
 * partout dans le code (moteur de jeu, composants Vue), avec vérification
 * TypeScript si un cas est oublié.
 */
export type Question =
  | BooleanQuestion
  | ChoiceQuestion
  | ImageQuestion
  | TextQuestion
  | NumberQuestion
  | MusicQuestion;

// --- Joueurs, équipes, réponses (utilisés par le moteur de jeu, pas par le parser) ---

export interface Player {
  id: string;
  nickname: string;
  teamId?: string;
  score: number;
  connected: boolean;
}

export interface Team {
  id: string;
  name: string;
  score: number;
}

export interface Answer {
  playerId: string;
  questionId: string;
  value: unknown;
  isCorrect?: boolean;
  submittedAt: number;
}
