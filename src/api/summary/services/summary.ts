/**
 * summary service
 */

import { factories } from '@strapi/strapi';
import { SummaryGenerationError } from './generation-errors';
import { generateSummary } from './summary-generator';
import { fetchTranscript, validateVideoId } from './transcript-provider';

interface AuthenticatedUser {
  id: number;
  documentId: string;
  credits?: number;
}

function affectedRowCount(result: unknown): number {
  if (typeof result === 'number') return result;
  if (Array.isArray(result)) return result.length;
  return Number(result) || 0;
}

export default factories.createCoreService('api::summary.summary', ({ strapi }) => ({
  async generateAndCreate(videoIdInput: unknown, user: AuthenticatedUser) {
    const videoId = validateVideoId(videoIdInput);
    if (!Number.isFinite(user.credits) || Number(user.credits) <= 0) {
      throw new SummaryGenerationError(
        'INSUFFICIENT_CREDITS',
        402,
        'You do not have enough credits.',
      );
    }

    const transcript = await fetchTranscript(videoId);
    const generated = await generateSummary(transcript);

    return strapi.db.transaction(async ({ trx }) => {
      const updated = await trx('up_users')
        .where({ id: user.id })
        .andWhere('credits', '>', 0)
        .decrement('credits', 1);

      if (affectedRowCount(updated) !== 1) {
        throw new SummaryGenerationError(
          'INSUFFICIENT_CREDITS',
          402,
          'You do not have enough credits.',
        );
      }

      return strapi.documents('api::summary.summary').create({
        status: 'published',
        data: {
          authorId: user.documentId,
          summary: generated.summary,
          title: generated.title,
          videoId,
        },
      });
    });
  },
}));
