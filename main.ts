// /workspace/main.ts

import { dictionary } from './hololive-dictionary/src/dictionary';
import fs from 'fs';
import path from 'path';

// Utility function to check if a word contains only English characters
function isEnglishOnly(word: string): boolean {
  return /^[A-Za-z0-9\s_'\\,\(\)α]+$/.test(word);
}

// Generate split name entries (e.g., 'ななし むめい' -> ['ななし', 'むめい'])
function generateSplitNameEntries(name: [string, string]): [string, string][] {
  const [reading, word] = name;
  const readingParts = reading.split(' ');
  const wordParts = word.split(' ');

  if (readingParts.length === wordParts.length) {
    return readingParts.map((part, index) => [part, wordParts[index]]);
  }
  return [];
}

// Transform the dictionary into a Migaku-compatible format
function transformToMigaku(dictionary: LiverData[]): string {
  const lines: string[] = [];

  dictionary.forEach(entry => {
    const baseNote = `${entry.name[1] ?? entry.name[0]} ${entry.marks[0] ?? ''}`.trim();
    if (entry.name[0].length !== 0) {
      if (!isEnglishOnly(entry.name[1])) {
        lines.push([entry.name[0], entry.name[1], '人名', baseNote].join('\t'));
        
        const splitEntries = generateSplitNameEntries(entry.name);
        splitEntries.forEach(([subReading, subWord]) => {
          if (!isEnglishOnly(subWord)) {
            lines.push([subReading, subWord, '人名', baseNote].join('\t'));
          }
        });
      }
    }

    entry.alias.forEach(alias => {
      const aliasReading = alias[0];
      const aliasWord = alias[1] ?? alias[0];
      if (!isEnglishOnly(aliasWord)) {
        lines.push([aliasReading, aliasWord, '人名(ニックネーム)', baseNote].join('\t'));
      }
    });

    if (entry.others) {
      entry.others.forEach(other => {
        const [reading, word] = other;
        if (!isEnglishOnly(word)) {
          lines.push([reading, word, '▶', baseNote].join('\t'));
        }
      });
    }
  });

  return lines.join('\n');
}

// Save the transformed data to a file
export function saveMigakuFile(filename: string = 'migaku_library.tsv') {
  const migakuData = transformToMigaku(dictionary);
  const outputPath = path.resolve(__dirname, filename);
  fs.writeFileSync(outputPath, migakuData);
  console.log(`Migaku library saved to ${outputPath}`);
}
