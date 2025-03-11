// /workspace/main.ts

import { dictionary as hololiveDictionary } from './hololive-dictionary/src/dictionary';
import fs from 'fs';
import path from 'path';

// Import the yomichan-dict-builder package
const {
  Dictionary,
  DictionaryIndex,
  TermEntry,
  KanjiEntry,
} = require('yomichan-dict-builder');

// Utility function: check if a word consists of only English characters
function isEnglishOnly(word: string): boolean {
  return /^[A-Za-z0-9\s_\-',\(\)α\\]+$/.test(word);
}

// Generate split name entries (e.g., [ 'ななし むめい', '七詩 ムメイ' ] becomes
// [ [ 'ななし', '七詩' ], [ 'むめい', 'ムメイ' ] ])
function generateSplitNameEntries(name: [string, string]): [string, string][] {
  const [reading, word] = name;
  const readingParts = reading.split(' ');
  const wordParts = word.split(' ');

  if (readingParts.length === wordParts.length) {
    return readingParts.map((part, index) => [part, wordParts[index]]);
  }
  return [];
}

// Async function to build the Yomichan dictionary
async function buildYomichanDictionary() {
  // Create a new dictionary instance (the output will be a zip file)
  const yomichanDict = new Dictionary({
    fileName: 'hololive-dictionary.zip',
  });

  // Build the dictionary index
  const index = new DictionaryIndex()
    .setTitle('Hololive Dictionary')
    .setRevision('1.0')
    .setAuthor('yukinyaa')
    .setDescription('Hololive name/term dictionary built from heppokofrontend/hololive-dictionary')
    .setAttribution('hololive-dictionary')
    .setUrl('https://github.com/Yukinyaa/hololive-names-dict')
    .build();

  await yomichanDict.setIndex(index);

  // Iterate over each hololive entry and add term entries
  for (const entry of hololiveDictionary) {
    if (entry.name[0].length != 0)
    {
      // Create a base note from the full name and first mark
      const baseNote = `${entry.name[1] ?? entry.name[0]} ${entry.marks[0] ?? ''}`.trim();

      // --- Main name entry ---
      // In hololive-dictionary, name is [reading, word]
      const mainTermEntry = new TermEntry(entry.name[1])
        .setReading(entry.name[0])
        .addDetailedDefinition(`人名: ${baseNote}`)
        .build();
      await yomichanDict.addTerm(mainTermEntry);

      // --- Split name entries (if the name contains spaces) ---
      const splitEntries = generateSplitNameEntries(entry.name);
      for (const [subReading, subWord] of splitEntries) {
        if (!isEnglishOnly(subWord)) {
          const splitEntry = new TermEntry(subWord)
            .setReading(subReading)
            .addDetailedDefinition(`人名: ${baseNote}`)
            .build();
          await yomichanDict.addTerm(splitEntry);
        }
      }

      // --- Alias entries ---
      entry.alias.forEach(async (alias: [string, string] | [string]) => {
        const aliasReading = alias[0];
        const aliasWord = alias[1] ?? alias[0];
        if (!isEnglishOnly(aliasWord)) {
          const aliasEntry = new TermEntry(aliasWord)
            .setReading(aliasReading)
            .addDetailedDefinition(`人名(ニックネーム): ${baseNote}`)
            .build();
          await yomichanDict.addTerm(aliasEntry);
        }
      });
      

      // --- Others entries ---
      if (entry.others) {
        for (const other of entry.others) {
          const [otherReading, otherWord] = other;
          if (!isEnglishOnly(otherWord)) {
            const othersEntry = new TermEntry(otherWord)
              .setReading(otherReading)
              .addDetailedDefinition(`Fanname/etc: ${baseNote}`)
              .build();
            await yomichanDict.addTerm(othersEntry);
          }
        }
      }
    } // end if (entry.name[0].length === 0)

  } // end for (const entry of hololiveDictionary)

  // Export the dictionary (this will create a zip file in the specified folder)
  const stats = await yomichanDict.export('./build');
  console.log('Done exporting!');
  console.table(stats);
}

// Run the build function and catch any errors
buildYomichanDictionary().catch(err => console.error(err));
