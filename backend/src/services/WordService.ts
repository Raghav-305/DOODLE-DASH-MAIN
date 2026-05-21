import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface WordCategories {
  [category: string]: string[];
}

export class WordService {
  private words: WordCategories;
  private allWords: string[];

  constructor() {
    const wordsPath = path.join(__dirname, '../../data/words.json');
    const rawData = fs.readFileSync(wordsPath, 'utf-8');
    this.words = JSON.parse(rawData) as WordCategories;
    this.allWords = Object.values(this.words).flat();
  }

  public getWordOptions(count: number, excludeWords: Set<string> = new Set()): string[] {
    const availableWords = this.allWords.filter(w => !excludeWords.has(w));

    // If not enough unique words, reset the exclusion set
    if (availableWords.length < count) {
      return this.getRandomWords(this.allWords, count);
    }

    return this.getRandomWords(availableWords, count);
  }

  public getWordByCategory(category: string, count: number): string[] {
    const categoryWords = this.words[category] || this.allWords;
    return this.getRandomWords(categoryWords, count);
  }

  public getCategories(): string[] {
    return Object.keys(this.words);
  }

  public validateWord(word: string): boolean {
    return this.allWords.includes(word.toLowerCase().trim());
  }

  private getRandomWords(pool: string[], count: number): string[] {
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }
}
