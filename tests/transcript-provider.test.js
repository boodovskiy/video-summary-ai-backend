const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');
const {
  buildTranscriptUrl,
  fetchTranscript,
  validateVideoId,
} = require('../dist/src/api/summary/services/transcript-provider.js');

const originalFetch = global.fetch;
const originalEnv = {
  apiUrl: process.env.TRANSCRIPT_API_URL,
  maxChars: process.env.TRANSCRIPT_MAX_CHARS,
  timeout: process.env.TRANSCRIPT_TIMEOUT_MS,
};

afterEach(() => {
  global.fetch = originalFetch;
  restoreEnv('TRANSCRIPT_API_URL', originalEnv.apiUrl);
  restoreEnv('TRANSCRIPT_MAX_CHARS', originalEnv.maxChars);
  restoreEnv('TRANSCRIPT_TIMEOUT_MS', originalEnv.timeout);
});

function restoreEnv(name, value) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

test('validates YouTube IDs and builds the provider URL', () => {
  assert.equal(validateVideoId('dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(
    buildTranscriptUrl('https://example.com/transcript/', 'dQw4w9WgXcQ').href,
    'https://example.com/transcript/dQw4w9WgXcQ',
  );

  assert.throws(() => validateVideoId('invalid'), (error) => {
    assert.equal(error.code, 'INVALID_VIDEO_ID');
    assert.equal(error.status, 400);
    return true;
  });
});

test('fetches and trims a transcript', async () => {
  process.env.TRANSCRIPT_API_URL = 'https://example.com/transcript';
  global.fetch = async (url) => {
    assert.equal(url.href, 'https://example.com/transcript/dQw4w9WgXcQ');
    return { ok: true, status: 200, text: async () => '  Transcript text  ' };
  };

  assert.equal(await fetchTranscript('dQw4w9WgXcQ'), 'Transcript text');
});

test('rejects missing and oversized transcripts', async () => {
  process.env.TRANSCRIPT_API_URL = 'https://example.com/transcript';
  process.env.TRANSCRIPT_MAX_CHARS = '4';
  global.fetch = async () => ({ ok: true, status: 200, text: async () => '12345' });

  await assert.rejects(fetchTranscript('dQw4w9WgXcQ'), (error) => {
    assert.equal(error.code, 'TRANSCRIPT_TOO_LARGE');
    assert.equal(error.status, 422);
    return true;
  });

  global.fetch = async () => ({ ok: false, status: 404, text: async () => '' });
  await assert.rejects(fetchTranscript('dQw4w9WgXcQ'), (error) => {
    assert.equal(error.code, 'TRANSCRIPT_NOT_FOUND');
    assert.equal(error.status, 422);
    return true;
  });
});
