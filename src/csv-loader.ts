import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { BM25 } from "./bm25.js";
import {
  CSV_CONFIG, STACK_CONFIG, STACK_SEARCH_COLS, STACK_OUTPUT_COLS,
  type CsvRow, type Domain, type StackName,
} from "./types.js";

export interface IndexedDomain {
  rows: CsvRow[];
  bm25: BM25;
  searchCols: string[];
  outputCols: string[];
}

/** Resolve the data/ directory relative to this package */
export function getDataDir(): string {
  const thisFile = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(thisFile), "..", "data");
}

/** Parse CSV text into array of row objects. Handles quoted fields. */
export function parseCsv(text: string): CsvRow[] {
  if (!text.trim()) return [];

  const lines = parseLines(text);
  if (lines.length < 2) return [];

  const headers = lines[0];
  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = lines[i];
    if (fields.length === 0 || (fields.length === 1 && fields[0] === "")) continue;
    const row: CsvRow = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = fields[j] ?? "";
    }
    rows.push(row);
  }
  return rows;
}

/** Parse CSV text into array of field arrays, handling quoted fields */
function parseLines(text: string): string[][] {
  const result: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ",") {
        current.push(field);
        field = "";
        i++;
      } else if (ch === "\n" || ch === "\r") {
        current.push(field);
        field = "";
        if (ch === "\r" && i + 1 < text.length && text[i + 1] === "\n") i++;
        result.push(current);
        current = [];
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }

  // Last field/line
  if (field || current.length > 0) {
    current.push(field);
    result.push(current);
  }

  return result;
}

/** Load and index a domain's CSV data */
export function loadDomain(domain: Domain, dataDir: string): IndexedDomain {
  const config = CSV_CONFIG[domain];
  const filePath = path.join(dataDir, config.file);
  const text = fs.readFileSync(filePath, "utf-8");
  const rows = parseCsv(text);

  const documents = rows.map((row) =>
    config.searchCols.map((col) => row[col] ?? "").join(" ")
  );

  const bm25 = new BM25();
  bm25.fit(documents);

  return { rows, bm25, searchCols: config.searchCols, outputCols: config.outputCols };
}

/** Load and index a stack's CSV data */
export function loadStack(stack: StackName, dataDir: string): IndexedDomain {
  const config = STACK_CONFIG[stack];
  const filePath = path.join(dataDir, config.file);
  const text = fs.readFileSync(filePath, "utf-8");
  const rows = parseCsv(text);

  const documents = rows.map((row) =>
    STACK_SEARCH_COLS.map((col) => row[col] ?? "").join(" ")
  );

  const bm25 = new BM25();
  bm25.fit(documents);

  return { rows, bm25, searchCols: STACK_SEARCH_COLS, outputCols: STACK_OUTPUT_COLS };
}
