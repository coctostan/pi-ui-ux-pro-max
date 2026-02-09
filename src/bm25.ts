/**
 * BM25 ranking algorithm for text search.
 * Ported from ui-ux-pro-max core.py.
 */
export class BM25 {
  private k1: number;
  private b: number;
  private corpus: string[][] = [];
  private docLengths: number[] = [];
  private avgdl = 0;
  private idf: Map<string, number> = new Map();
  private N = 0;

  constructor(k1 = 1.5, b = 0.75) {
    this.k1 = k1;
    this.b = b;
  }

  /** Lowercase, split, remove punctuation, filter words with length <= 2 */
  tokenize(text: string): string[] {
    const cleaned = String(text).toLowerCase().replace(/[^\w\s]/g, " ");
    return cleaned.split(/\s+/).filter((w) => w.length > 2);
  }

  /** Build BM25 index from an array of document strings */
  fit(documents: string[]): void {
    this.corpus = documents.map((doc) => this.tokenize(doc));
    this.N = this.corpus.length;
    if (this.N === 0) return;

    this.docLengths = this.corpus.map((doc) => doc.length);
    this.avgdl = this.docLengths.reduce((a, b) => a + b, 0) / this.N;

    const docFreqs = new Map<string, number>();
    for (const doc of this.corpus) {
      const seen = new Set<string>();
      for (const word of doc) {
        if (!seen.has(word)) {
          docFreqs.set(word, (docFreqs.get(word) ?? 0) + 1);
          seen.add(word);
        }
      }
    }

    this.idf = new Map();
    for (const [word, freq] of docFreqs) {
      this.idf.set(word, Math.log((this.N - freq + 0.5) / (freq + 0.5) + 1));
    }
  }

  /** Score all documents against query, returns array of [index, score] sorted descending */
  score(query: string): [number, number][] {
    const queryTokens = this.tokenize(query);
    const scores: [number, number][] = [];

    for (let idx = 0; idx < this.corpus.length; idx++) {
      const doc = this.corpus[idx];
      const docLen = this.docLengths[idx];
      const termFreqs = new Map<string, number>();
      for (const word of doc) {
        termFreqs.set(word, (termFreqs.get(word) ?? 0) + 1);
      }

      let score = 0;
      for (const token of queryTokens) {
        const idfVal = this.idf.get(token);
        if (idfVal !== undefined) {
          const tf = termFreqs.get(token) ?? 0;
          const numerator = tf * (this.k1 + 1);
          const denominator =
            tf + this.k1 * (1 - this.b + (this.b * docLen) / this.avgdl);
          score += idfVal * (numerator / denominator);
        }
      }

      scores.push([idx, score]);
    }

    return scores.sort((a, b) => b[1] - a[1]);
  }
}
