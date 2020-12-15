/* eslint-env node */
/* eslint no-console: "off" */

const path = require('path');
const express = require('express');
const app = express();

// Run static server
app.use('/', express.static(path.join(__dirname, 'demo')));
app.use('/js', express.static(path.join(__dirname, 'dist')));
app.listen(8080);

console.log('🚀 Paint worklet test up and running at http://localhost:8080/');
console.log('ℹ️  Press Ctrl+C to return to the real world.');