// src/bm25.test.ts
import { describe, it, expect } from "vitest";
import { BM25 } from "./bm25.js";

describe("BM25", () => {
  it("returns empty scores for empty corpus", () => {
    const bm25 = new BM25();
    bm25.fit([]);
    const scores = bm25.score("test");
    expect(scores).toEqual([]);
  });

  it("ranks exact match highest", () => {
    const bm25 = new BM25();
    bm25.fit([
      "the quick brown fox",
      "SaaS dashboard analytics",
      "lazy dog sleeping",
    ]);
    const scores = bm25.score("SaaS dashboard");
    // Index 1 should have highest score
    expect(scores[0][0]).toBe(1);
    expect(scores[0][1]).toBeGreaterThan(0);
  });

  it("scores zero for no matching terms", () => {
    const bm25 = new BM25();
    bm25.fit(["apple banana cherry"]);
    const scores = bm25.score("xylophone");
    expect(scores[0][1]).toBe(0);
  });

  it("tokenizes and lowercases correctly", () => {
    const bm25 = new BM25();
    bm25.fit(["Hello, World! This is a TEST."]);
    const scores = bm25.score("hello world test");
    expect(scores[0][1]).toBeGreaterThan(0);
  });

  it("filters short words (length <= 2)", () => {
    const bm25 = new BM25();
    bm25.fit(["an is it the dashboard"]);
    const scores = bm25.score("an is it");
    // All query words are <= 2 chars, so no matches
    expect(scores[0][1]).toBe(0);
  });

  it("ranks documents with more matching terms higher", () => {
    const bm25 = new BM25();
    bm25.fit([
      "modern clean design",
      "modern clean design minimalist professional",
      "unrelated text here",
    ]);
    const scores = bm25.score("modern clean design minimalist");
    // Doc 1 (index 1) matches all 4 terms, doc 0 matches 3
    expect(scores[0][0]).toBe(1);
    expect(scores[1][0]).toBe(0);
  });
});
