export type Difficulty = "easy" | "medium" | "hard";
export interface WordChoice { word: string; difficulty: Difficulty }

const EASY = ["apple", "house", "tree", "fish", "car", "sun", "cat", "book", "cup", "hat"];
const MEDIUM = ["volcano", "bicycle", "pyramid", "rocket", "guitar", "castle", "lantern", "octopus"];
const HARD = ["xylophone", "constellation", "metamorphosis", "philosopher", "kaleidoscope"];

function pick<T>(arr: T[]) { return arr[Math.floor(Math.random()*arr.length)]; }

export function generateWordChoices(): WordChoice[] {
  return [
    { word: pick(EASY), difficulty: "easy" },
    { word: pick(MEDIUM), difficulty: "medium" },
    { word: pick(HARD), difficulty: "hard" },
  ];
}

export function maskWord(word: string, revealed: number[] = []): string {
  return word
    .split("")
    .map((ch, i) => (ch === " " ? "  " : revealed.includes(i) ? ch.toUpperCase() : "_"))
    .join(" ");
}
