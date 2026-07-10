const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const { resolveSqliteFilename } = require('../dist/config/database.js');

test('keeps an absolute SQLite filename on the mounted volume', () => {
  assert.equal(resolveSqliteFilename('/data/data.db'), '/data/data.db');
});

test('resolves a relative SQLite filename inside the application', () => {
  const filename = resolveSqliteFilename('.tmp/data.db');

  assert.equal(path.isAbsolute(filename), true);
  assert.equal(filename.endsWith(path.join('.tmp', 'data.db')), true);
});
