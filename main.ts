import { dictionary } from './hololive-dictionary/src/dictionary';

// Check the structure of the dictionary
// console.log(dictionary);

// Example: Manipulate the dictionary
const data = dictionary.find(entry => entry.name[0] === 'おとのせ かなで');
console.log(data);