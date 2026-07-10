const assert = require('node:assert/strict');
const test = require('node:test');
const routeConfig = require('../dist/src/api/summary/routes/01-custom-summary.js').default;

test('registers the authenticated summary generation route', () => {
  assert.equal(routeConfig.type, 'content-api');
  assert.deepEqual(routeConfig.routes, [
    {
      method: 'POST',
      path: '/summaries/generate',
      handler: 'api::summary.summary.generate',
    },
  ]);
  assert.notEqual(routeConfig.routes[0].config?.auth, false);
});
