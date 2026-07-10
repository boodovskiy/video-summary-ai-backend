const assert = require('node:assert/strict');
const test = require('node:test');
const {
  ensureAuthenticatedSummaryPermission,
} = require('../dist/src/index.js');

function createStrapiMock(permissions) {
  const created = [];
  const role = { id: 2, type: 'authenticated', permissions };

  return {
    created,
    strapi: {
      db: {
        query(uid) {
          if (uid === 'plugin::users-permissions.role') {
            return { findOne: async () => role };
          }
          if (uid === 'plugin::users-permissions.permission') {
            return {
              create: async ({ data }) => {
                created.push(data);
              },
            };
          }
          throw new Error(`Unexpected query: ${uid}`);
        },
      },
      log: { info() {}, warn() {} },
    },
  };
}

test('grants summary generation to authenticated users once', async () => {
  const missing = createStrapiMock([]);
  await ensureAuthenticatedSummaryPermission(missing.strapi);
  assert.deepEqual(missing.created, [
    { action: 'api::summary.summary.generate', role: 2 },
  ]);

  const existing = createStrapiMock([
    { action: 'api::summary.summary.generate' },
  ]);
  await ensureAuthenticatedSummaryPermission(existing.strapi);
  assert.deepEqual(existing.created, []);
});
