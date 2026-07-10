const assert = require('node:assert/strict');
const test = require('node:test');
const { generateSummary } = require('../dist/src/api/summary/services/summary-generator.js');

test('generateSummary fails safely when OpenAI is not configured', async () => {
  const originalApiKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  try {
    await assert.rejects(generateSummary('Transcript'), (error) => {
      assert.equal(error.code, 'AI_NOT_CONFIGURED');
      assert.equal(error.status, 503);
      return true;
    });
  } finally {
    if (originalApiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalApiKey;
  }
});
