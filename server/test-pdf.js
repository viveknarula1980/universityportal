import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
console.log('--- TYPE ---', typeof pdf);
console.log('--- KEYS ---', Object.keys(pdf));
console.log('--- DEFAULT ---', typeof pdf.default);
