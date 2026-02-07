
export enum Dimension {
  EXTERNAL = 'EXTERNAL',
  INTERNAL = 'INTERNAL',
  DEFENSE = 'DEFENSE'
}

export interface Question {
  id: number;
  text: string;
  dimension: Dimension;
  options: {
    label: string;
    text: string;
    weight: number; // 1.0 (A), 0.6 (B), 0.3 (C), 0.0 (D)
  }[];
}

export interface PressureLevel {
  level: number;
  range: [number, number];
  tag: string;
  keywords: string[];
  description: string;
}

export interface QuizResult {
  totalScore: number;
  level: PressureLevel;
  dimensionScores: {
    [key in Dimension]: number;
  };
  answers: string[];
}
